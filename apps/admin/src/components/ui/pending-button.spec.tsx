import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PendingContent, PendingDots, SubmitButton } from "./pending-button";

import type * as ReactDom from "react-dom";

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactDom>();
  return {
    ...actual,
    useFormStatus: () => ({ pending: true, data: null, method: null, action: null }),
  };
});

describe("PendingDots", () => {
  it("is decorative", () => {
    const { container } = render(<PendingDots />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("span span")).toHaveLength(3);
  });
});

describe("PendingContent", () => {
  it("keeps the idle label when nothing is pending", () => {
    render(<PendingContent pending={false} label="Save" />);
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.queryByText("Saving")).not.toBeInTheDocument();
  });

  it("shows the pending label beside the dots", () => {
    const { container } = render(<PendingContent pending label="Save" pendingLabel="Saving" />);
    expect(screen.getByText("Saving")).toBeInTheDocument();
    expect(container.querySelector(".admin-pending-dots")).toBeInTheDocument();
  });
});

describe("SubmitButton", () => {
  it("disables and announces busy while the form action is pending", () => {
    render(
      <form>
        <SubmitButton className="test">Create account</SubmitButton>
      </form>,
    );

    const button = screen.getByRole("button", { name: /create account/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
