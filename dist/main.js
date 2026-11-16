import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { SYSTEM_SLUG, TenantLoggerService, } from './logger/tenant-logger.service.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
    });
    const logger = app.get(TenantLoggerService);
    app.useLogger(logger);
    const config = configureApp(app);
    app.enableShutdownHooks();
    await app.listen(config.port, config.host);
    logger
        .forTenant(SYSTEM_SLUG)
        .info({ event: 'app.started', host: config.host, port: config.port }, `FacturON API escuchando en ${config.host}:${config.port}`);
}
bootstrap().catch((err) => {
    console.error('Fallo al iniciar FacturON API:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map