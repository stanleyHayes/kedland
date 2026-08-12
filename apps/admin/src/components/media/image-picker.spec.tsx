import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { ImagePicker } from "./image-picker";

/**
 * The picker an editor actually meets.
 *
 * What is pinned here is the part the native control got wrong: the rules are
 * on screen before anything is chosen, a refusal names the reason, and a
 * refused file does not stay in the input where the form would send it anyway.
 */

const typist = () => userEvent.setup({ delay: null });

/** A file of a given type and claimed size, without allocating the bytes. */
function file(name: string, type: string, size: number): File {
  const made = new File(["x"], name, { type });
  Object.defineProperty(made, "size", { value: size });
  return made;
}

beforeAll(() => {
  // jsdom implements neither, and the component revokes what it creates.
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("ImagePicker", () => {
  it("states the accepted formats and the size limit before anything is chosen", () => {
    render(<ImagePicker name="file" label="Image" />);

    expect(screen.getByText(/JPG, PNG, WebP or AVIF/i)).toBeInTheDocument();
    expect(screen.getByText(/up to 25 MB/i)).toBeInTheDocument();
  });

  /** The native control's worst habit: no button, just "Choose File". */
  it("offers a real button rather than the browser's own control", () => {
    render(<ImagePicker name="file" label="Image" />);

    expect(screen.getByRole("button", { name: /choose a photograph/i })).toBeInTheDocument();
  });

  it("limits what the file dialogue will even offer", () => {
    const { container } = render(<ImagePicker name="file" label="Image" />);

    const input = container.querySelector('input[type="file"]');
    expect(input?.getAttribute("accept")).toBe("image/jpeg,image/png,image/webp,image/avif");
  });

  it("shows the chosen photograph's name and size", async () => {
    const user = typist();
    const { container } = render(<ImagePicker name="file" label="Image" />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    await user.upload(input, file("open-day.jpg", "image/jpeg", 2 * 1024 * 1024));

    expect(screen.getByText(/open-day\.jpg · 2\.0 MB/i)).toBeInTheDocument();
  });

  it("previews the photograph rather than only naming it", async () => {
    const user = typist();
    const { container } = render(<ImagePicker name="file" label="Image" />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    await user.upload(input, file("open-day.jpg", "image/jpeg", 1024));

    expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:preview");
  });

  it("names the format it will not take", async () => {
    // The file dialogue would not have offered this one — that is what `accept`
    // is for, and the test above covers it. This is the second line of defence:
    // a file arriving by drag and drop, or a browser treating `accept` as
    // advice, still has to be refused in words.
    const user = userEvent.setup({ delay: null, applyAccept: false });
    const { container } = render(<ImagePicker name="file" label="Image" />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    await user.upload(input, file("scan.heic", "image/heic", 1024));

    expect(await screen.findByRole("alert")).toHaveTextContent(/HEIC cannot be used/i);
  });

  it("says how big the file is and what the limit is", async () => {
    const user = typist();
    const { container } = render(<ImagePicker name="file" label="Image" />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    await user.upload(input, file("huge.jpg", "image/jpeg", 40 * 1024 * 1024));

    expect(await screen.findByRole("alert")).toHaveTextContent(/40 MB.*limit is 25 MB/i);
  });

  /**
   * A refusal has to empty the input too. Leaving the file there means the very
   * thing just rejected is what the form submits.
   */
  it("does not leave a refused file in the input", async () => {
    const user = typist();
    const { container } = render(<ImagePicker name="file" label="Image" />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    await user.upload(input, file("huge.jpg", "image/jpeg", 40 * 1024 * 1024));

    expect(input.files).toHaveLength(0);
  });

  it("shows the photograph already in use before a new one is chosen", () => {
    const { container } = render(
      <ImagePicker name="file" label="Image" currentUrl="https://cdn.test/current.jpg" />,
    );

    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://cdn.test/current.jpg");
  });

  it("tells the form when a choice is made and when it is cleared", async () => {
    const onChoose = vi.fn();
    const user = typist();
    const { container } = render(<ImagePicker name="file" label="Image" onChoose={onChoose} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    await user.upload(input, file("open-day.jpg", "image/jpeg", 1024));
    expect(onChoose).toHaveBeenLastCalledWith(expect.objectContaining({ name: "open-day.jpg" }));

    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(onChoose).toHaveBeenLastCalledWith(null);
  });
});
