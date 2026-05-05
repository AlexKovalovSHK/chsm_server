import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
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
      const submissionsRes = await classroom.courses.courseWork.studentSubmissions.list({
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
      console.error(`Ошибка при получении списка студентов курса ${courseId}:`, error);
      return [];
    }
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
    return results;
  }

  async saveGoogleTokens(state: string, email: string, tokens: any, profile: any) {
    return this.userService.saveGoogleTokens(state, email, tokens, profile);
  }

  async getLiveFullState(tokens: any) {
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
              photo: t.profile?.photoUrl
            })),
            students: (studentsRes.data.students || []).map((s: any) => ({
              id: s.userId,
              name: s.profile?.name?.fullName,
              email: s.profile?.emailAddress,
              photo: s.profile?.photoUrl
            })),
          };
        } catch (error: any) {
          console.error(`Ошибка при получении данных курса ${course.id}:`, error.message);
          return { id: course.id, name: course.name, error: 'Ошибка доступа к участникам' };
        }
      }),
    );

    return {
      fetchedAt: new Date(),
      totalCourses: courses.length,
      courses: fullState,
    };
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
