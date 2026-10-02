import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { resolve } from 'path';
import { APP_CONFIG } from './config/app-config.js';
export function configureApp(app) {
    const config = app.get(APP_CONFIG);
    app.useBodyParser('json', { limit: config.bodyLimit });
    app.useBodyParser('urlencoded', { limit: config.bodyLimit, extended: true });
    app.useStaticAssets(resolve(config.publicDir));
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    if (config.nodeEnv !== 'production') {
        const doc = SwaggerModule.createDocument(app, new DocumentBuilder()
            .setTitle('FacturON API')
            .setVersion('3.0.0')
            .build());
        SwaggerModule.setup('docs', app, doc);
    }
    return config;
}
//# sourceMappingURL=app.setup.js.map