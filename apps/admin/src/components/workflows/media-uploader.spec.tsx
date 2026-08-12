import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const getMediaUploadSignature = vi.fn();
const registerMedia = vi.fn();

vi.mock("@/app/(dashboard)/actions", () => ({
  getMediaUploadSignature: (folder?: string) => getMediaUploadSignature(folder) as unknown,
  registerMedia: (input: unknown) => registerMedia(input) as unknown,
}));

const { MediaUploader } = await import("./media-uploader");

/**
 * Adding a photograph to the library.
 *
 * Two things here are worth holding still. Every parameter the API signed has
 * to reach Cloudinary or the signature cannot verify — the profile form learnt
 * that the expensive way. And the library must never gain a row for a
 * photograph that was refused: a media entry pointing at nothing is worse than
 * no entry, because it appears in every picker and renders as a broken image.
 */

const SIGNATURE = {
  uploadUrl: "https://api.cloudinary.test/v1_1/kedland/image/upload",
  apiKey: "key-1",
  timestamp: 1_700_000_000,
  folder: "kedland",
  transformation: "c_limit,w_2400,h_2400,q_auto:good",
  signature: "abc123",
  maxBytes: 25 * 1024 * 1024,
};

const RESULT = {
  public_id: "kedland/open-day",
  secure_url: "https://cdn.test/open-day.jpg",
  width: 1600,
  height: 900,
  format: "jpg",
  bytes: 900_000,
};

const typist = () => userEvent.setup({ delay: null });

function photo(size = 900_000): File {
  const made = new File(["x"], "open-day.jpg", { type: "image/jpeg" });
  Object.defineProperty(made, "size", { value: size });
  return made;
}

async function fillIn(container: HTMLElement, file: File): Promise<void> {
  const user = typist();
  await user.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, file);
  await user.type(screen.getByLabelText(/alt text/i), "Children at the open day");
}

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  // The component reloads the page so the new item appears. jsdom cannot
  // navigate and reports that on its own error console; it does not throw, so
  // nothing here needs to stub it — and `location.reload` is non-configurable
  // anyway, so trying would fail the file before a single test ran.
});

describe("MediaUploader", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getMediaUploadSignature.mockReset().mockResolvedValue(SIGNATURE);
    registerMedia.mockReset().mockResolvedValue(undefined);
    fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(RESULT) });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("states the accepted formats and the size limit up front", () => {
    render(<MediaUploader />);

    expect(screen.getByText(/JPG, PNG, WebP or AVIF/i)).toBeInTheDocument();
    expect(screen.getByText(/up to 25 MB/i)).toBeInTheDocument();
  });

  it("sends every parameter the signature covers, transformation included", async () => {
    const user = typist();
    const { container } = render(<MediaUploader />);
    await fillIn(container, photo());

    await user.click(screen.getByRole("button", { name: /upload image/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const body = (fetchMock.mock.calls[0]?.[1] as { body: FormData }).body;
    expect(body.get("transformation")).toBe(SIGNATURE.transformation);
    expect(body.get("folder")).toBe(SIGNATURE.folder);
    expect(body.get("signature")).toBe(SIGNATURE.signature);
    expect(body.get("file")).toBeInstanceOf(File);
  });

  it("records the photograph in the library once Cloudinary has stored it", async () => {
    const user = typist();
    const { container } = render(<MediaUploader />);
    await fillIn(container, photo());

    await user.click(screen.getByRole("button", { name: /upload image/i }));

    await waitFor(() => {
      expect(registerMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          publicId: RESULT.public_id,
          url: RESULT.secure_url,
          alt: "Children at the open day",
        }),
      );
    });
  });

  /** A row pointing at a photograph that was never stored is worse than none. */
  it("does not add a library row when the upload is refused", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: () => Promise.resolve({}) });
    const user = typist();
    const { container } = render(<MediaUploader />);
    await fillIn(container, photo());

    await user.click(screen.getByRole("button", { name: /upload image/i }));

    expect(await screen.findByText(/did not accept/i)).toBeInTheDocument();
    expect(registerMedia).not.toHaveBeenCalled();
  });

  /**
   * The library is where every alt text on the public site comes from, so an
   * entry without one is a photograph nobody using a screen reader can place.
   * The browser enforces it before the handler ever runs, which is why this
   * asserts the refusal rather than a message.
   */
  it("insists on a description, because the library is where alt text comes from", async () => {
    const user = typist();
    const { container } = render(<MediaUploader />);
    await user.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, photo());

    expect(screen.getByLabelText(/alt text/i)).toBeRequired();

    await user.click(screen.getByRole("button", { name: /upload image/i }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks for a photograph when none was chosen", async () => {
    const user = typist();
    render(<MediaUploader />);
    await user.type(screen.getByLabelText(/alt text/i), "Children at the open day");

    await user.click(screen.getByRole("button", { name: /upload image/i }));

    expect(await screen.findByText(/choose an image/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
