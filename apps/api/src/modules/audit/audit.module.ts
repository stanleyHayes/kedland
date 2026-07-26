import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";
import { AuditLog, AuditLogSchema } from "./schemas/audit-log.schema";

/** Global: almost every module writes to the trail, and none should have to
 *  import it explicitly to do so. */
@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
