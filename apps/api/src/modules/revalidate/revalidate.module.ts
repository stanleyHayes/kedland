import { Global, Module } from "@nestjs/common";

import { RevalidateService } from "./revalidate.service";

/**
 * Global, because anything that changes what the public site shows needs it —
 * posts today, page content next — and threading it through each module's
 * imports would be ceremony for a service with no state and one dependency.
 */
@Global()
@Module({
  providers: [RevalidateService],
  exports: [RevalidateService],
})
export class RevalidateModule {}
