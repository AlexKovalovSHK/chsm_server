// src/classroom/schemas/course.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Course extends Document {
  @Prop({ unique: true, required: true })
  googleCourseId: string; // ID из Google Classroom

  @Prop({ required: true })
  name: string;

  @Prop()
  section: string; // Например, "Группа А" или "2024 год"

  @Prop()
  description: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CourseSchema = SchemaFactory.createForClass(Course);