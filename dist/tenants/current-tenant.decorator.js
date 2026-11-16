import { createParamDecorator } from '@nestjs/common';
export const CurrentTenant = createParamDecorator((_, ctx) => {
    return ctx.switchToHttp().getRequest().tenant;
});
//# sourceMappingURL=current-tenant.decorator.js.map