import type { Response } from 'express';
import { type AppConfig } from '../config/app-config.js';
export declare class WebController {
    private readonly config;
    constructor(config: AppConfig);
    config_(res: Response): void;
    index(res: Response): void;
}
