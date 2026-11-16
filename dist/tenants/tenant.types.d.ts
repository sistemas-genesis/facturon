import { z } from 'zod';
export declare const tenantSchema: any;
export type Tenant = z.infer<typeof tenantSchema>;
