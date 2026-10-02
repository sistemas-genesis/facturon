import { HttpException } from '@nestjs/common';
export declare class LegacyError extends HttpException {
    constructor(status: number, msg: string);
}
