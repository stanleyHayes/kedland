import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, type QueryFilter } from "mongoose";

import {
  paginate,
  type Enquiry as EnquiryDto,
  type EnquiryInput,
  type EnquiryStatus,
  type Paginated,
} from "@kedland/types";

import { AuditService } from "../audit/audit.service";

import { MailService } from "./mail.service";
import { Enquiry, type EnquiryDocument } from "./schemas/enquiry.schema";

@Injectable()
export class EnquiriesService {
  private readonly logger = new Logger(EnquiriesService.name);

  constructor(
    @InjectModel(Enquiry.name) private readonly enquiries: Model<EnquiryDocument>,
    private readonly mail: MailService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Records an enquiry, then tries to tell the school.
   *
   * The order is the whole design. Persisting first means a Resend outage
   * costs the school a notification, not a family's message — the enquiry is
   * already safe, and `notified: false` is what the dashboard escalates. The
   * parent gets the same confirmation either way, because from where they are
   * standing the school *has* received it.
   */
  async submit(input: EnquiryInput): Promise<{ id: string; notified: boolean }> {
    const created = await this.enquiries.create({
      parentName: input.parentName,
      email: input.email,
      phone: input.phone,
      topic: input.topic,
      level: input.level,
      message: input.message,
      status: "new",
      notified: false,
    });

    const notified = await this.mail.sendEnquiry(input);
    if (notified) {
      await this.enquiries.updateOne({ _id: created._id }, { $set: { notified: true } }).exec();
    } else {
      this.logger.warn(
        `Enquiry ${created.id} was saved but the school was not emailed — it needs picking up from the dashboard`,
      );
    }

    return { id: created.id, notified };
  }

  /**
   * The dashboard's list, newest first.
   *
   * Paginated, and capped. An unbounded find would return every enquiry the
   * school has ever received in one response — fine on the first day, a slow
   * page and a large payload after two years, and there is no reason for the
   * inbox to load more than a screenful at a time.
   */
  async list(status: EnquiryStatus | undefined, page = 1, pageSize = 25): Promise<Paginated<EnquiryDto>> {
    const filter: QueryFilter<EnquiryDocument> = status ? { status } : {};

    const [found, total] = await Promise.all([
      this.enquiries
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.enquiries.countDocuments(filter).exec(),
    ]);

    return paginate(
      found.map((document) => this.toDto(document)),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<EnquiryDto> {
    return this.toDto(await this.get(id));
  }

  /**
   * Moves an enquiry through triage.
   *
   * Who dealt with it and when is recorded rather than just the state, because
   * "did anyone reply to this family?" is a question the office will actually
   * ask, and a bare status cannot answer it. Returning to `new` clears both,
   * so a mis-click does not leave a false record of someone having replied.
   */
  async setStatus(id: string, status: EnquiryStatus, actorId: string): Promise<EnquiryDto> {
    const enquiry = await this.get(id);
    const dealtWith = status !== "new";

    enquiry.status = status;
    enquiry.handledAt = dealtWith ? new Date() : null;
    enquiry.handledById = dealtWith ? new Types.ObjectId(actorId) : null;
    await enquiry.save();

    await this.audit.record({
      actorId,
      action: "update",
      entityType: "enquiry",
      entityId: id,
      changes: { status },
    });

    return this.toDto(enquiry);
  }

  /**
   * Deletes an enquiry.
   *
   * Kept for a data-protection request — a parent may ask the school to erase
   * what they sent — which is why it is a hard delete rather than a flag, and
   * why the audit entry records the fact but never the message.
   */
  async remove(id: string, actorId: string, role: string): Promise<void> {
    if (role !== "admin") {
      throw new ForbiddenException("Only an administrator can delete an enquiry");
    }

    const enquiry = await this.get(id);
    await enquiry.deleteOne();

    await this.audit.record({
      actorId,
      action: "delete",
      entityType: "enquiry",
      entityId: id,
    });
  }

  /** How many need attention — for the dashboard's badge. */
  async counts(): Promise<{ unread: number; undelivered: number }> {
    const [unread, undelivered] = await Promise.all([
      this.enquiries.countDocuments({ status: "new" }).exec(),
      this.enquiries.countDocuments({ notified: false }).exec(),
    ]);

    return { unread, undelivered };
  }

  private async get(id: string): Promise<EnquiryDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException("No such enquiry");

    const enquiry = await this.enquiries.findById(id).exec();
    if (!enquiry) throw new NotFoundException("No such enquiry");

    return enquiry;
  }

  private toDto(document: EnquiryDocument): EnquiryDto {
    const timestamps = document as EnquiryDocument & { createdAt: Date };

    return {
      id: document.id,
      parentName: document.parentName,
      email: document.email,
      phone: document.phone,
      topic: document.topic,
      level: document.level,
      message: document.message,
      status: document.status,
      notified: document.notified,
      createdAt: timestamps.createdAt.toISOString(),
      handledAt: document.handledAt?.toISOString() ?? null,
      // `toHexString` rather than `toString`: it says what the result is, and
      // it is not the Object default the linter has to guess about.
      handledBy: document.handledById?.toHexString() ?? null,
    };
  }
}
