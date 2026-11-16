var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import Sybase from 'sybase';
export class DbDriver {
}
let SybaseDriver = class SybaseDriver extends DbDriver {
    connect(db) {
        const conn = new Sybase(db.host, db.port, db.db, db.user, db.pass);
        return new Promise((resolve, reject) => {
            conn.connect((err) => {
                if (err)
                    return reject(err);
                resolve({
                    query: (sql) => new Promise((res, rej) => conn.query(sql, (e, data) => e ? rej(e) : res((data ?? [])))),
                    close: () => {
                        try {
                            conn.disconnect();
                        }
                        catch {
                        }
                    },
                });
            });
        });
    }
};
SybaseDriver = __decorate([
    Injectable()
], SybaseDriver);
export { SybaseDriver };
let SybaseService = class SybaseService {
    driver;
    constructor(driver) {
        this.driver = driver;
    }
    async withConnection(tenant, fn) {
        const conn = await this.driver.connect(tenant.db);
        try {
            return await fn(conn);
        }
        finally {
            conn.close();
        }
    }
    query(tenant, sql) {
        return this.withConnection(tenant, (c) => c.query(sql));
    }
};
SybaseService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DbDriver])
], SybaseService);
export { SybaseService };
//# sourceMappingURL=sybase.service.js.map