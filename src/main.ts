import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import basicAuth from 'express-basic-auth';

dotenv.config();

// Для отладки - проверяем значение
console.log('=== ENV LOADED ===');
console.log('DEV =', process.env.DEV);
console.log('==================');

async function bootstrap() {
  const PORT = process.env.PORT || 3000;
  //const app = await NestFactory.create(AppModule);
  const app = await NestFactory.create(AppModule.register());
  // Добавляем Basic Auth для Swagger
  app.use(
    ['/api/docs', '/api/docs-json', '/api/docs-download'],
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

  // Эндпоинт для скачивания JSON
  app.getHttpAdapter().get('/api/docs-download', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="swagger.json"');
    res.send(document);
  });

  // Эндпоинт для скачивания YAML
  app.getHttpAdapter().get('/api/docs-download/yaml', (req, res) => {
    const yaml = require('js-yaml');
    const yamlString = yaml.dump(document);
    res.setHeader('Content-Type', 'application/x-yaml');
    res.setHeader('Content-Disposition', 'attachment; filename="swagger.yaml"');
    res.send(yamlString);
  });

  SwaggerModule.setup('/api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        'https://chsm.shk.solutions',
        'https://chsm.pro',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5008',
      ];

      const isAllowed =
        allowedOrigins.includes(origin) ||
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
