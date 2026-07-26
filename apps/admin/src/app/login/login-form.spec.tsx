import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

vi.mock("./actions", () => ({ signIn: vi.fn() }));

describe("LoginForm", () => {
  it("labels both fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("masks the password", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("type", "password");
  });

  /**
   * `username` and `current-password`, so a password manager offers the saved
   * credentials. Staff sign in rarely; making them remember it is how the
   * password ends up on a sticky note.
   */
  it("lets a password manager fill it", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toHaveAttribute("autoComplete", "username");
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("autoComplete", "current-password");
  });

  it("submits", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button", { name: /sign in/i })).toHaveAttribute("type", "submit");
  });
});
