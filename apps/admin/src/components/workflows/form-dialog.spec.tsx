import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";

import { FormDialog } from "./form-dialog";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

describe("FormDialog", () => {
  it("keeps form fields out of view until its action is chosen", async () => {
    render(
      <FormDialog title="Create FAQ" triggerLabel="Add FAQ">
        <form>
          <label>
            Question
            <input name="question" />
          </label>
        </form>
      </FormDialog>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add FAQ" }));

    expect(screen.getByRole("dialog", { name: "Create FAQ" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Question" })).toBeVisible();
  });

  it("closes, restores page scrolling and returns focus to the trigger", async () => {
    render(
      <FormDialog title="Edit details" triggerLabel="Edit">
        <p>Fields</p>
      </FormDialog>,
    );

    const trigger = screen.getByRole("button", { name: "Edit" });
    await userEvent.click(trigger);
    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.click(screen.getByRole("button", { name: "Close Edit details" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(trigger).toHaveFocus();
  });
});
