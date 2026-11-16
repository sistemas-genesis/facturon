import type { NestExpressApplication } from '@nestjs/platform-express';
import { type AppConfig } from './config/app-config.js';
export declare function configureApp(app: NestExpressApplication): AppConfig;
