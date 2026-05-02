import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import basicAuth from 'express-basic-auth';

async function bootstrap() {
  const PORT = process.env.PORT || 3000;
  const app = await NestFactory.create(AppModule);

  // Добавляем Basic Auth для Swagger
  app.use(
    ['/api/docs', '/api/docs-json'],
    basicAuth({
      users: { admin: 'Abc!1234' },
      challenge: true,
    }),
  );

  // Настройка Swagger
  const config = new DocumentBuilder()
    .setTitle('CHSM Classroom Integrations')
    .setDescription('Docs REST API')
    .setVersion('1.0.0')
    .addTag('ALEX K')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        'https://chsm.shk.solutions',
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5008",
      ];

      const isAllowed = allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('chrome-extension://');

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin '${origin}' not allowed by CORS`));
      }
    },
    credentials: true,
  });

  await app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

bootstrap();
