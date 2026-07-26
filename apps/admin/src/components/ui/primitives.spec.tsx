import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "./primitives";

describe("EmptyState", () => {
  it("renders a labelled state with animated icon, supporting copy, and an action", () => {
    render(
      <EmptyState
        icon="book"
        title="No posts yet"
        body="Create the first school story."
        action={<button type="button">Create draft</button>}
      />,
    );

    const state = screen.getByRole("region", { name: "No posts yet" });
    expect(state).toHaveTextContent("Create the first school story.");
    expect(screen.getByRole("button", { name: "Create draft" })).toBeInTheDocument();
    expect(state.querySelector(".admin-empty-icon")).toBeInTheDocument();
  });

  it("supports a compact treatment for constrained panels", () => {
    render(<EmptyState compact title="Media required" body="Upload an image first." />);

    expect(screen.getByRole("region", { name: "Media required" })).toHaveClass("admin-empty-state-compact");
  });
});
