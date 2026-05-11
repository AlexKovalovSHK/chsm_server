import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { google, classroom_v1 } from 'googleapis';
import { UserService } from '../../users/application/user.service';
import { GoogleAuthService } from './google-auth.service';

@Injectable()
export class ClassroomService implements OnModuleInit {
  private oauth2Client: any;

  constructor(
    private readonly googleAuthService: GoogleAuthService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  onModuleInit() {
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('❌ ОШИБКА: GOOGLE_CLIENT_ID не найден в .env');
    }
  }

  private getClassroom(tokens: any): classroom_v1.Classroom {
    this.oauth2Client.setCredentials(tokens);
    return google.classroom({ version: 'v1', auth: this.oauth2Client });
  }

  getAuthUrl(state: string) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      state: state,
      scope: [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
        'https://www.googleapis.com/auth/classroom.rosters.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/classroom.announcements',
        'https://www.googleapis.com/auth/classroom.profile.emails',
        'https://www.googleapis.com/auth/gmail.send',
      ],
    });
  }

  getAuthUrlByTg(tgId: string) {
    return this.getAuthUrl(tgId);
  }

  getAuthUrlByEmail(email: string) {
    return this.getAuthUrl(email);
  }

  async getGoogleProfile(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const res = await oauth2.userinfo.get();
    return res.data;
  }

  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(String(code));
    return tokens;
  }

  async getAllCourses(tokens: any) {
    const classroom = this.getClassroom(tokens);
    const res = await classroom.courses.list({ courseStates: ['ACTIVE'] });
    return res.data.courses || [];
  }

  async getAssignments(tokens: any, courseId: string) {
    const classroom = this.getClassroom(tokens);
    const res = await classroom.courses.courseWork.list({ courseId });
    return res.data.courseWork || [];
  }

  async getFullGradebook(tokens: any, courseId: string) {
    const classroom = this.getClassroom(tokens);
    const courseworkRes = await classroom.courses.courseWork.list({ courseId });
    const coursework = courseworkRes.data.courseWork || [];
    const report: any[] = [];

    for (const work of coursework) {
      const submissionsRes =
        await classroom.courses.courseWork.studentSubmissions.list({
          courseId,
          courseWorkId: work.id!,
        });
      report.push({
        assignment: work.title,
        results:
          submissionsRes.data.studentSubmissions?.map((sub) => ({
            studentId: sub.userId,
            grade: sub.assignedGrade,
            state: sub.state,
          })) || [],
      });
    }
    return report;
  }

  async getStudents(tokens: any, courseId: string) {
    const classroom = this.getClassroom(tokens);

    try {
      const res = await classroom.courses.students.list({
        courseId: courseId,
      });
      return res.data.students || [];
    } catch (error) {
      console.error(
        `Ошибка при получении списка студентов курса ${courseId}:`,
        error,
      );
      return [];
    }
  }

  async getAllStudents(tokens: any) {
    const classroom = this.getClassroom(tokens);

    // 1. Получаем все активные курсы
    const courses = await this.getAllCourses(tokens);

    // 2. Запускаем параллельное получение списков студентов для всех курсов
    const studentRequests = courses.map(async (course) => {
      try {
        const res = await classroom.courses.students.list({
          courseId: course.id!,
        });
        return res.data.students || [];
      } catch (error: any) {
        console.error(
          `Ошибка при получении студентов курса ${course.id}:`,
          error.message,
        );
        return [];
      }
    });

    const results = await Promise.all(studentRequests);

    // 3. Собираем всех студентов в плоский массив
    const allStudentsRaw = results.flat();

    // 4. Удаляем дубликаты, используя Map (ключ — userId)
    const uniqueStudentsMap = new Map();

    allStudentsRaw.forEach((s) => {
      if (s.userId && !uniqueStudentsMap.has(s.userId)) {
        uniqueStudentsMap.set(s.userId, {
          id: s.userId,
          name: s.profile?.name?.fullName || 'Без имени',
          email: s.profile?.emailAddress?.toLowerCase() || '',
          photo: s.profile?.photoUrl,
        });
      }
    });

    // Превращаем Map обратно в массив
    return Array.from(uniqueStudentsMap.values());
  }

  async getStudentGrades(tokens: any, studentEmail: string) {
    const classroom = this.getClassroom(tokens);

    // 1. Получаем все активные курсы
    const coursesRes = await classroom.courses.list({
      courseStates: ['ACTIVE'],
    });
    const courses = coursesRes.data.courses || [];

    const studentReport = {
      profile: null as any,
      courses: [] as any[],
    };

    // 2. Итерируемся по курсам, чтобы найти оценки студента
    await Promise.all(
      courses.map(async (course) => {
        try {
          // Запрашиваем сабмишены студента в этом курсе
          // userId: 'email' или 'ID' позволяет фильтровать данные конкретного человека
          // courseWorkId: '-' означает "все задания в этом курсе"
          const submissionsRes =
            await classroom.courses.courseWork.studentSubmissions.list({
              courseId: course.id!,
              courseWorkId: '-',
              userId: studentEmail,
            });

          const submissions = submissionsRes.data.studentSubmissions || [];

          if (submissions.length > 0) {
            // Если мы еще не достали профиль, берем его из первого попавшегося сабмишена
            if (!studentReport.profile) {
              // Чтобы получить полное имя, можно сделать отдельный запрос,
              // но часто в сабмишене ID достаточно для поиска позже
              studentReport.profile = {
                email: studentEmail,
                userId: submissions[0].userId,
              };
            }

            // Получаем названия заданий для этого курса, чтобы оценки не были "голыми"
            const courseWorkRes = await classroom.courses.courseWork.list({
              courseId: course.id!,
            });
            const assignments = courseWorkRes.data.courseWork || [];

            // Сопоставляем оценку с названием задания
            const grades = submissions.map((sub) => {
              const work = assignments.find((w) => w.id === sub.courseWorkId);
              return {
                assignmentTitle: work?.title || 'Неизвестное задание',
                grade: sub.assignedGrade || sub.draftGrade || 'Нет оценки',
                maxPoints: work?.maxPoints,
                status: sub.state, // TURNED_IN, RETURNED и т.д.
                alternateLink: work?.alternateLink, // Ссылка на задание
              };
            });

            studentReport.courses.push({
              courseName: course.name,
              courseId: course.id,
              grades: grades,
            });
          }
        } catch (error: any) {
          // Если студента нет в этом курсе, API выдаст 404/403, просто игнорируем
        }
      }),
    );

    return studentReport;
  }

  async getCourses(tokens: any) {
    return this.getAllCourses(tokens);
  }

  async postAnnouncementToAll(tokens: any, text: string) {
    const classroom = this.getClassroom(tokens);
    const courses = await this.getAllCourses(tokens);

    const results: { course: string; status: string; error?: string }[] = [];

    for (const course of courses) {
      if (!course.id) continue;

      try {
        await classroom.courses.announcements.create({
          courseId: course.id,
          requestBody: {
            text: text,
            state: 'PUBLISHED',
          },
        });

        results.push({
          course: course.name || 'Без названия',
          status: 'success',
        });
      } catch (e: any) {
        results.push({
          course: course.name || 'Без названия',
          status: 'error',
          error: e.message,
        });
      }
    }

    // Invalidate cache after successfully posting announcements to ensure data consistency
    await this.cacheManager.del('classroom_full_state');

    return results;
  }

  async saveGoogleTokens(
    state: string,
    email: string,
    tokens: any,
    profile: any,
  ) {
    return this.userService.saveGoogleTokens(state, email, tokens, profile);
  }

  async getLiveFullState(tokens: any, forceRefresh: boolean = false) {
    const cacheKey = 'classroom_full_state';

    // If force refresh, delete the existing cache entry
    if (forceRefresh) {
      await this.cacheManager.del(cacheKey);
    }

    // Cache-Aside: check Redis before calling Google API
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return {
        ...cached,
        fromCache: true,
      };
    }

    const classroom = this.getClassroom(tokens);

    const coursesRes = await classroom.courses.list({
      courseStates: ['ACTIVE'],
    });
    const courses = coursesRes.data.courses || [];

    const fullState = await Promise.all(
      courses.map(async (course) => {
        try {
          const [studentsRes, teachersRes] = await Promise.all([
            classroom.courses.students.list({ courseId: course.id! }),
            classroom.courses.teachers.list({ courseId: course.id! }),
          ]);

          return {
            id: course.id,
            name: course.name,
            section: course.section,
            alternateLink: course.alternateLink,
            teachers: (teachersRes.data.teachers || []).map((t: any) => ({
              id: t.userId,
              name: t.profile?.name?.fullName,
              email: t.profile?.emailAddress,
              photo: t.profile?.photoUrl,
            })),
            students: (studentsRes.data.students || []).map((s: any) => ({
              id: s.userId,
              name: s.profile?.name?.fullName,
              email: s.profile?.emailAddress,
              photo: s.profile?.photoUrl,
            })),
          };
        } catch (error: any) {
          console.error(
            `Ошибка при получении данных курса ${course.id}:`,
            error.message,
          );
          return {
            id: course.id,
            name: course.name,
            error: 'Ошибка доступа к участникам',
          };
        }
      }),
    );

    const result = {
      fetchedAt: new Date(),
      totalCourses: courses.length,
      courses: fullState,
      fromCache: false,
    };

    // Store in Redis with 1 hour TTL (3600000 ms)
    await this.cacheManager.set(cacheKey, result, 3600000);

    return result;
  }

  async saveAdminTokens(email: string, tokens: any) {
    return this.googleAuthService.saveAdminTokens(email, tokens);
  }

  async getAdminTokens() {
    return this.googleAuthService.getAdminTokens();
  }

  async sendEmail(to: string, subject: string, text: string) {
    const tokens = await this.getAdminTokens();
    this.oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const emailLines = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      text,
    ];

    const email = emailLines.join('\r\n').trim();

    const encodedMessage = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
  }
}
