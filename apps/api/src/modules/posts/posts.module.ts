import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AdminPostsController, PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { Post, PostSchema } from "./schemas/post.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }])],
  controllers: [PostsController, AdminPostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
