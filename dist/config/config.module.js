var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_JSON, DEFAULT_APP_CONFIG_FILE, loadAppJson, } from './app-json.js';
import { APP_CONFIG, envFromServerJson, parseConfig, } from './app-config.js';
let AppConfigModule = class AppConfigModule {
};
AppConfigModule = __decorate([
    Global(),
    Module({
        imports: [ConfigModule.forRoot({ isGlobal: true })],
        providers: [
            {
                provide: APP_JSON,
                useFactory: () => loadAppJson(process.env.APP_CONFIG_FILE ?? DEFAULT_APP_CONFIG_FILE),
            },
            {
                provide: APP_CONFIG,
                inject: [APP_JSON],
                useFactory: (json) => {
                    const fromJson = envFromServerJson(json.server);
                    const merged = { ...fromJson };
                    for (const [k, v] of Object.entries(process.env))
                        if (v !== undefined && v !== '')
                            merged[k] = v;
                    return parseConfig(merged);
                },
            },
        ],
        exports: [APP_JSON, APP_CONFIG],
    })
], AppConfigModule);
export { AppConfigModule };
//# sourceMappingURL=config.module.js.map