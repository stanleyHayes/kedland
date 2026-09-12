import { type Connection } from "mongoose";

import { RETIRED_MEDIA_IDS, RETIRED_POST_SLUGS } from "@kedland/types";

import { type RevalidateService } from "../../modules/revalidate/revalidate.service";

import { WebsiteUpdateService } from "./website-update.service";

it("retires only known seed records and their tiles, safely on repeated startup", async () => {
  const media = {
    find: jest.fn().mockReturnValue({ toArray: () => Promise.resolve([{ _id: "seed-object-id" }]) }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  };
  const posts = { deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }) };
  const tiles = { deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }) };
  const collection = jest.fn((name: string) => ({ media, posts, instagram_tiles: tiles })[name]);
  const revalidate = { gallery: jest.fn(), post: jest.fn() };
  const service = new WebsiteUpdateService(
    { collection } as unknown as Connection,
    revalidate as unknown as RevalidateService,
  );
  await service.removeRetiredContent();
  await service.removeRetiredContent();
  expect(media.deleteMany).toHaveBeenCalledWith({
    publicId: { $in: [...RETIRED_MEDIA_IDS] },
    uploadedById: null,
  });
  expect(posts.deleteMany).toHaveBeenCalledWith({
    slug: { $in: [...RETIRED_POST_SLUGS] },
    authorId: null,
  });
  expect(tiles.deleteMany).toHaveBeenCalledWith({
    mediaId: { $in: [...RETIRED_MEDIA_IDS, "seed-object-id"] },
  });
  expect(revalidate.gallery).not.toHaveBeenCalled();
  media.deleteMany.mockResolvedValue({ deletedCount: 1 });
  posts.deleteMany.mockResolvedValue({ deletedCount: 1 });
  await service.removeRetiredContent();
  expect(revalidate.gallery).toHaveBeenCalled();
  expect(revalidate.post).toHaveBeenCalledTimes(RETIRED_POST_SLUGS.length);
});
