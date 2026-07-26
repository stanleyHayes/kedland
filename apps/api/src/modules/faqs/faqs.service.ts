import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AuditService } from "../audit/audit.service";
import { RevalidateService } from "../revalidate/revalidate.service";

import { Faq, type FaqDocument } from "./schemas/faq.schema";

import type { Faq as FaqDto, FaqInput, FaqUpdate } from "@kedland/types";

@Injectable()
export class FaqsService {
  constructor(
    @InjectModel(Faq.name) private readonly faqs: Model<FaqDocument>,
    private readonly audit: AuditService,
    private readonly revalidate: RevalidateService,
  ) {}

  async list(includeDrafts = true): Promise<FaqDto[]> {
    const items = await this.faqs
      .find(includeDrafts ? {} : { published: true })
      .sort({ group: 1, order: 1, createdAt: 1 })
      .exec();
    return items.map(toDto);
  }

  /** Add a packaged FAQ only when the school has not already authored it. */
  async ensureStarter(input: FaqInput): Promise<boolean> {
    if (await this.faqs.exists({ question: input.question })) return false;
    await this.faqs.create({ ...input, updatedById: null });
    return true;
  }

  async create(input: FaqInput, actorId: string): Promise<FaqDto> {
    const item = await this.faqs.create({ ...input, updatedById: new Types.ObjectId(actorId) });
    await this.audit.record({
      actorId,
      action: "create",
      entityType: "faq",
      entityId: item.id,
      changes: { group: input.group, question: input.question },
    });
    await Promise.all([this.revalidate.page("faqs"), this.revalidate.faqs()]);
    return toDto(item);
  }

  async update(id: string, input: FaqUpdate, actorId: string): Promise<FaqDto> {
    const item = await this.get(id);
    Object.assign(item, input, { updatedById: new Types.ObjectId(actorId) });
    await item.save();
    await this.audit.record({
      actorId,
      action: "update",
      entityType: "faq",
      entityId: id,
      changes: input,
    });
    await Promise.all([this.revalidate.page("faqs"), this.revalidate.faqs()]);
    return toDto(item);
  }

  async remove(id: string, actorId: string): Promise<void> {
    const item = await this.get(id);
    await item.deleteOne();
    await this.audit.record({ actorId, action: "delete", entityType: "faq", entityId: id });
    await Promise.all([this.revalidate.page("faqs"), this.revalidate.faqs()]);
  }

  private async get(id: string): Promise<FaqDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("No such FAQ");
    const item = await this.faqs.findById(id).exec();
    if (!item) throw new NotFoundException("No such FAQ");
    return item;
  }
}

function toDto(item: FaqDocument): FaqDto {
  return {
    id: item.id,
    group: item.group,
    question: item.question,
    answer: item.answer,
    order: item.order,
    published: item.published,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
