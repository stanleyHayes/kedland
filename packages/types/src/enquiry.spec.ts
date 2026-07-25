import { describe, expect, it } from "vitest";

import { enquirySchema } from "./enquiry";

const valid = {
  parentName: "Ama Mensah",
  email: "ama@example.com",
  phone: "+233 24 123 4567",
  topic: "book-a-tour",
  level: "nursery-2",
  message: "I would like to book a tour for my daughter.",
};

describe("enquirySchema", () => {
  it("accepts a complete enquiry", () => {
    expect(enquirySchema.safeParse(valid).success).toBe(true);
  });

  /**
   * A parent who does not know which class their child belongs in must still
   * be able to send the form. Both fields default rather than being required.
   */
  it("defaults the topic and level when a parent skips them", () => {
    const { topic: _topic, level: _level, ...bare } = valid;
    const parsed = enquirySchema.parse(bare);

    expect(parsed.topic).toBe("general");
    expect(parsed.level).toBe("not-sure");
  });

  it("refuses a topic outside the closed vocabulary", () => {
    expect(enquirySchema.safeParse({ ...valid, topic: "complaint" }).success).toBe(false);
  });

  /**
   * Ghanaian numbers are written many ways. Rejecting a real number over
   * formatting loses the school an enrolment, so the accepted set is wide.
   */
  it.each(["0241234567", "+233241234567", "024 123 4567", "(024) 123-4567", "+233 24 123 4567"])(
    "accepts %s",
    (phone) => {
      expect(enquirySchema.safeParse({ ...valid, phone }).success).toBe(true);
    },
  );

  it.each(["not a phone", "call me", "12", ""])("rejects %s as a phone number", (phone) => {
    expect(enquirySchema.safeParse({ ...valid, phone }).success).toBe(false);
  });

  it("rejects a message that is only whitespace", () => {
    // Trimming before the length check is the difference between an empty
    // enquiry being caught here and the office receiving a blank email.
    expect(enquirySchema.safeParse({ ...valid, message: "   " }).success).toBe(false);
  });

  it("trims the values it stores", () => {
    const parsed = enquirySchema.parse({ ...valid, parentName: "  Ama Mensah  " });
    expect(parsed.parentName).toBe("Ama Mensah");
  });

  it("rejects an invalid email", () => {
    expect(enquirySchema.safeParse({ ...valid, email: "ama@" }).success).toBe(false);
  });

  it("caps the message so a paste cannot fill the database", () => {
    expect(enquirySchema.safeParse({ ...valid, message: "x".repeat(2001) }).success).toBe(false);
  });

  /**
   * The build package is explicit that the site takes enquiries, not
   * admissions. A field like a date of birth arriving here would mean the
   * school is collecting a child's personal data through a route nobody
   * designed to safeguard — `strictObject` refuses it rather than storing it.
   */
  it("refuses fields the contract does not declare", () => {
    const result = enquirySchema.safeParse({ ...valid, childDateOfBirth: "2021-04-02" });
    expect(result.success).toBe(false);
  });

  it("asks for nothing that identifies a child", () => {
    // The guard above only catches fields someone sends. This catches a field
    // someone *adds* — the contract itself must stay free of them.
    const fields = Object.keys(enquirySchema.shape);

    expect(fields).not.toContain("childName");
    expect(fields).not.toContain("childDateOfBirth");
  });
});
