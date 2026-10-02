import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { resolve } from 'path';
import { APP_CONFIG, type AppConfig } from './config/app-config.js';

/** Shared by main.ts and the e2e tests so both run the same HTTP pipeline. */
export function configureApp(app: NestExpressApplication): AppConfig {
  const config = app.get<AppConfig>(APP_CONFIG);
  // el servicio original aceptaba cuerpos de hasta 500mb (XML grandes, firmas en base64)
  app.useBodyParser('json', { limit: config.bodyLimit });
  app.useBodyParser('urlencoded', { limit: config.bodyLimit, extended: true });
  app.useStaticAssets(resolve(config.publicDir));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  if (config.nodeEnv !== 'production') {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('FacturON API')
        .setVersion('3.0.0')
        .build(),
    );
    SwaggerModule.setup('docs', app, doc);
  }
  return config;
}
