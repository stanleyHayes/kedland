import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AdminSelectField } from "./admin-select-field";

const OPTIONS = [
  { value: "news", label: "News" },
  { value: "events", label: "Events" },
  { value: "learning", label: "Learning" },
];

describe("AdminSelectField", () => {
  it("opens a branded listbox and submits the selected value", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <AdminSelectField
          id="category"
          name="category"
          label="Category"
          options={OPTIONS}
          defaultValue="news"
          required
        />
      </form>,
    );

    const trigger = screen.getByRole("combobox", { name: "Category" });
    expect(trigger).toHaveTextContent("News");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole("listbox", { name: "Category" })).toBeVisible();

    await user.click(screen.getByRole("option", { name: "Events" }));
    expect(trigger).toHaveTextContent("Events");
    expect(document.querySelector('input[name="category"]')).toHaveValue("events");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("supports keyboard selection and controlled updates", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <AdminSelectField
        id="category"
        label="Category"
        options={OPTIONS}
        value="news"
        required
        onValueChange={onValueChange}
      />,
    );

    const trigger = screen.getByRole("combobox", { name: "Category" });
    trigger.focus();
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("events");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape without changing the value", async () => {
    const user = userEvent.setup();
    render(
      <AdminSelectField
        id="category"
        name="category"
        label="Category"
        options={OPTIONS}
        defaultValue="learning"
        required
      />,
    );

    const trigger = screen.getByRole("combobox", { name: "Category" });
    trigger.focus();
    await user.keyboard("{Enter}{Escape}");

    expect(trigger).toHaveTextContent("Learning");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
