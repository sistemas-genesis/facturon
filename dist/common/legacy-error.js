import { HttpException } from '@nestjs/common';
export class LegacyError extends HttpException {
    constructor(status, msg) {
        super({ success: false, msg, legacy: true }, status);
    }
}
//# sourceMappingURL=legacy-error.js.map