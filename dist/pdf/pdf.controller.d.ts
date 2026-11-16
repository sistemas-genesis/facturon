import type { Response } from 'express';
import { RideService } from '../ride/ride.service.js';
export declare class PdfController {
    private readonly ride;
    constructor(ride: RideService);
    download(file: string, res: Response): void;
}
