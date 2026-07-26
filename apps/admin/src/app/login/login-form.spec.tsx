import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

vi.mock("./actions", () => ({ signIn: vi.fn() }));

describe("LoginForm", () => {
  it("labels both fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Password", { selector: "input" })).toBeInTheDocument();
  });

  it("masks the password", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Password", { selector: "input" })).toHaveAttribute("type", "password");
  });

  it("lets staff reveal and hide the password without submitting the form", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const password = screen.getByLabelText("Password", { selector: "input" });
    const show = screen.getByRole("button", { name: "Show password" });

    expect(show).toHaveAttribute("type", "button");
    expect(show).toHaveAttribute("aria-pressed", "false");

    await user.click(show);
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("raises the field and visibility icons with the admin neumorphic treatment", () => {
    const { container } = render(<LoginForm />);

    expect(container.querySelectorAll(".admin-field-glyph")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Show password" })).toHaveClass("admin-password-toggle");
  });

  /**
   * `username` and `current-password`, so a password manager offers the saved
   * credentials. Staff sign in rarely; making them remember it is how the
   * password ends up on a sticky note.
   */
  it("lets a password manager fill it", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toHaveAttribute("autoComplete", "username");
    expect(screen.getByLabelText("Password", { selector: "input" })).toHaveAttribute(
      "autoComplete",
      "current-password",
    );
  });

  it("submits", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button", { name: /sign in/i })).toHaveAttribute("type", "submit");
  });
});
