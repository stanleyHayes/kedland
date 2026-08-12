import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmForm } from "./confirm-form";

/**
 * The last thing between a misclick and a deleted post.
 *
 * Every destructive action in the dashboard is wrapped in this — removing a
 * post, a photograph, a member of staff. None of them can be undone, so the one
 * behaviour that matters is that cancelling actually cancels. A confirmation
 * that asks and then submits anyway is worse than none, because it teaches
 * people to trust it.
 */

const typist = () => userEvent.setup({ delay: null });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ConfirmForm", () => {
  it("asks before doing anything, in the caller's words", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = typist();
    render(
      <ConfirmForm action={vi.fn()} message="Delete “Sports Day”? This cannot be undone.">
        <button type="submit">Delete</button>
      </ConfirmForm>,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(confirm).toHaveBeenCalledWith("Delete “Sports Day”? This cannot be undone.");
  });

  it("runs the action once the deletion is confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const action = vi.fn();
    const user = typist();
    render(
      <ConfirmForm action={action} message="Delete this?">
        <button type="submit">Delete</button>
      </ConfirmForm>,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(action).toHaveBeenCalled();
    });
  });

  /** The one that matters: cancelling has to actually cancel. */
  it("never runs the action when the deletion is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const action = vi.fn();
    const user = typist();
    render(
      <ConfirmForm action={action} message="Delete this?">
        <button type="submit">Delete</button>
      </ConfirmForm>,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(action).not.toHaveBeenCalled();
  });

  it("passes its class through, so callers keep control of layout", () => {
    const { container } = render(
      <ConfirmForm action={vi.fn()} message="Delete this?" className="inline-flex">
        <button type="submit">Delete</button>
      </ConfirmForm>,
    );

    expect(container.querySelector("form")).toHaveClass("inline-flex");
  });
});
