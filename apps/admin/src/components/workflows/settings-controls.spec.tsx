import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(dashboard)/actions", () => ({
  changePasswordAction: vi.fn(),
}));

const { AppearanceSettings } = await import("./settings-controls");

describe("AppearanceSettings", () => {
  it("persists and applies a selected dashboard theme", async () => {
    const user = userEvent.setup();
    render(<AppearanceSettings />);

    await user.click(screen.getByRole("button", { name: /dark\s*lower glare workspace/i }));

    expect(window.localStorage.getItem("kedland-admin-theme")).toBe("dark");
    expect(document.documentElement.dataset["adminTheme"]).toBe("dark");
    expect(screen.getByRole("button", { name: /dark\s*lower glare workspace/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
