import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  APP_JSON,
  AppJson,
  DEFAULT_APP_CONFIG_FILE,
  loadAppJson,
} from './app-json.js';
import {
  APP_CONFIG,
  AppConfig,
  envFromServerJson,
  parseConfig,
} from './app-config.js';

/**
 * Configuracion tipada y validada:
 * - APP_JSON:   config/app.config.json (ruta en APP_CONFIG_FILE) con todo lo global de negocio.
 * - APP_CONFIG: seccion "server" del JSON; el entorno (.env) solo puede sobrescribirla.
 * Cualquier valor invalido o faltante aborta el arranque indicando cual es.
 */
@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    {
      provide: APP_JSON,
      useFactory: (): AppJson =>
        loadAppJson(process.env.APP_CONFIG_FILE ?? DEFAULT_APP_CONFIG_FILE),
    },
    {
      provide: APP_CONFIG,
      inject: [APP_JSON],
      useFactory: (json: AppJson): AppConfig => {
        const fromJson = envFromServerJson(json.server);
        const merged: Record<string, string | undefined> = { ...fromJson };
        for (const [k, v] of Object.entries(process.env))
          if (v !== undefined && v !== '') merged[k] = v;
        return parseConfig(merged);
      },
    },
  ],
  exports: [APP_JSON, APP_CONFIG],
})
export class AppConfigModule {}
