import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './module.app/app.module';
import { urlencoded, json } from 'express';
import { ValidationPipe } from '@nestjs/common';
import fs from 'fs';
import path = require('path');

async function bootstrap() {
  const tmpDir = path.join(__dirname, 'module.app/.tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  const sessionDir = path.join(__dirname, 'module.app/session');
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(json({ limit: '500mb' }));
  app.use(urlencoded({ extended: true, limit: '500mb' }));
  app.enableCors();
  await app.listen(3015);
}
bootstrap();
