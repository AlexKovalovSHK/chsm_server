import { Injectable, OnModuleInit } from '@nestjs/common';
import { google, classroom_v1 } from 'googleapis';
import { Course } from '../schemas/course.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ClassroomService implements OnModuleInit {
  private oauth2Client: any;

  constructor(
    // ВНЕДРЯЕМ МОДЕЛЬ ТУТ:
    @InjectModel(Course.name) private courseModel: Model<Course>,
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

  // ИСПРАВЛЕНИЕ 1: Теперь принимает tgId и передает его в state
  getAuthUrl(tgId: string) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      state: tgId, // ПЕРЕДАЕМ TG_ID ДЛЯ СИНХРОНИЗАЦИИ
      scope: [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
        'https://www.googleapis.com/auth/classroom.rosters.readonly',
        'https://www.googleapis.com/auth/userinfo.email', // НУЖНО ДЛЯ EMAIL
        'https://www.googleapis.com/auth/userinfo.profile', // НУЖНО ДЛЯ ИМЕНИ/ФОТО
        'https://www.googleapis.com/auth/classroom.announcements',
      ],
    });
  }

  // ИСПРАВЛЕНИЕ 2: Метод для получения данных профиля
  async getGoogleProfile(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
    // Используем oauth2 API вместо classroom
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const res = await oauth2.userinfo.get();
    return res.data; // Здесь лежат email, given_name, family_name, picture
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

  // src/classroom/service/classroom.service.ts

  async getStudents(tokens: any, courseId: string) {
    // 1. Инициализируем клиент с токенами админа
    const classroom = this.getClassroom(tokens);

    try {
      // 2. Делаем запрос к списку студентов курса
      const res = await classroom.courses.students.list({
        courseId: courseId,
      });

      // 3. Возвращаем массив студентов (или пустой массив, если никого нет)
      // Каждый объект студента содержит: userId, profile (name, emailAddress, photoUrl)
      return res.data.students || [];
    } catch (error) {
      console.error(
        `Ошибка при получении списка студентов курса ${courseId}:`,
        error,
      );
      // В случае ошибки (например, курс не найден), возвращаем пустой список, чтобы не ломать фронтенд
      return [];
    }
  }

  async syncCoursesToDb(tokens: any) {
    const googleCourses = await this.getAllCourses(tokens);

    for (const gCourse of googleCourses) {
      if (!gCourse.id) continue;

      await this.courseModel.findOneAndUpdate(
        { googleCourseId: gCourse.id },
        {
          $set: {
            name: gCourse.name,
            section: gCourse.section,
            description: gCourse.descriptionHeading,
          },
        },
        { upsert: true },
      );
    }
    return { message: 'Курсы синхронизированы', count: googleCourses.length };
  }

  async getCourses(data: any) {
    // Просто возвращаем всё, что сохранили в базу
    return this.courseModel.find({ isActive: true }).exec();
  }

  async postAnnouncementToAll(tokens: any, text: string) {
    const classroom = this.getClassroom(tokens);
    const courses = await this.getAllCourses(tokens);

    // 1. Явно указываем тип массива (вместо never)
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
}
