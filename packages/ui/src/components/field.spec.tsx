import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Field, SelectField, TextareaField } from "./field";

/**
 * The form fields.
 *
 * Every assertion here is an accessibility requirement rather than a
 * preference — these are the things that decide whether someone using a screen
 * reader can complete the school's contact form at all.
 */

const OPTIONS = [
  { value: "general", label: "General enquiry" },
  { value: "admissions", label: "Admissions" },
];

describe("Field", () => {
  it("ties the label to the input", () => {
    render(<Field id="name" label="Your name" required />);
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
  });

  /**
   * A placeholder disappears the moment someone types. Someone who looks away
   * mid-form has no way to get it back, which is why it is never the label.
   */
  it("keeps the label visible even with a placeholder present", () => {
    render(<Field id="name" label="Your name" placeholder="e.g. Ama Mensah" required />);

    expect(screen.getByText("Your name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Ama Mensah")).toBeInTheDocument();
  });

  it("marks an optional field in words rather than punctuation", () => {
    // "*" read aloud is "star", which tells a listener nothing.
    render(<Field id="age" label="Child's age" />);
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });

  it("does not mark a required field optional", () => {
    render(<Field id="name" label="Your name" required />);
    expect(screen.queryByText("(optional)")).not.toBeInTheDocument();
  });

  describe("when it is invalid", () => {
    it("says so in a way a screen reader reports", () => {
      render(<Field id="email" label="Email" error="Enter a valid email" required />);

      expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email");
    });

    it("points the control at its message", () => {
      render(<Field id="email" label="Email" error="Enter a valid email" required />);
      const input = screen.getByLabelText("Email");

      expect(input.getAttribute("aria-describedby")).toContain("email-error");
    });

    it("conveys the error in text, not only in colour", () => {
      // WCAG 1.4.1: colour must never be the only carrier of meaning.
      render(<Field id="email" label="Email" error="Enter a valid email" required />);
      expect(screen.getByText("Enter a valid email")).toBeVisible();
    });
  });

  it("describes itself with both hint and error when it has both", () => {
    render(<Field id="phone" label="Phone" hint="We will call you." error="Too short" required />);
    const describedBy = screen.getByLabelText("Phone").getAttribute("aria-describedby") ?? "";

    expect(describedBy).toContain("phone-hint");
    expect(describedBy).toContain("phone-error");
  });

  it("describes nothing when it has neither", () => {
    render(<Field id="name" label="Your name" required />);
    expect(screen.getByLabelText("Your name")).not.toHaveAttribute("aria-describedby");
  });

  it("is not marked invalid when it is fine", () => {
    render(<Field id="name" label="Your name" required />);
    expect(screen.getByLabelText("Your name")).not.toHaveAttribute("aria-invalid");
  });
});

describe("TextareaField", () => {
  it("labels the textarea", () => {
    render(<TextareaField id="message" label="Your message" required />);
    expect(screen.getByLabelText("Your message").tagName).toBe("TEXTAREA");
  });

  it("reports its error the same way an input does", () => {
    render(<TextareaField id="message" label="Your message" error="Tell us a little more" required />);

    expect(screen.getByLabelText("Your message")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Tell us a little more");
  });
});

describe("SelectField", () => {
  it("labels the select and lists its options", () => {
    render(<SelectField id="topic" label="What is this about?" options={OPTIONS} required />);

    expect(screen.getByLabelText("What is this about?")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("reports its error the same way an input does", () => {
    render(
      <SelectField id="topic" label="What is this about?" options={OPTIONS} error="Pick one" required />,
    );

    expect(screen.getByLabelText("What is this about?")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Pick one");
  });
});
