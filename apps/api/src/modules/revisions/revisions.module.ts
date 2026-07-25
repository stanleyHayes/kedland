import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { RevisionsService } from "./revisions.service";
import { Revision, RevisionSchema } from "./schemas/revision.schema";

/** Global for the same reason as the audit trail: content, posts and settings
 *  all snapshot, and threading the import through each is noise. */
@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Revision.name, schema: RevisionSchema }])],
  providers: [RevisionsService],
  exports: [RevisionsService],
})
export class RevisionsModule {}
