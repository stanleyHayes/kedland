import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const getMediaUploadSignature = vi.fn();
const updateProfilePhoto = vi.fn();

vi.mock("@/app/(dashboard)/actions", () => ({
  getMediaUploadSignature: (folder?: string) => getMediaUploadSignature(folder) as unknown,
  updateProfilePhoto: (url: string) => updateProfilePhoto(url) as unknown,
}));

const { ProfilePhotoUploader } = await import("./profile-photo-uploader");

/**
 * The upload that could never have worked.
 *
 * The API signs `{ folder, timestamp, transformation }` and Cloudinary
 * recomputes that signature from whatever the browser actually sends. This form
 * omitted `transformation`, so the two could never agree: every photograph, from
 * every member of staff, was refused. Nothing in the type system objects to a
 * missing `FormData` entry, so the guard has to be a test.
 */

const SIGNATURE = {
  uploadUrl: "https://api.cloudinary.test/v1_1/kedland/image/upload",
  apiKey: "key-1",
  timestamp: 1_700_000_000,
  folder: "kedland/profiles",
  transformation: "c_limit,w_2400,h_2400,q_auto:good",
  signature: "abc123",
  maxBytes: 25 * 1024 * 1024,
};

const typist = () => userEvent.setup({ delay: null });

function portrait(): File {
  const made = new File(["x"], "portrait.jpg", { type: "image/jpeg" });
  Object.defineProperty(made, "size", { value: 900_000 });
  return made;
}

/** Selects a photograph through the picker's real file input. */
async function choose(container: HTMLElement): Promise<void> {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  await typist().upload(input, portrait());
}

/** The FormData the browser sent to Cloudinary. */
function sentToCloudinary(fetchMock: ReturnType<typeof vi.fn>): FormData {
  return (fetchMock.mock.calls[0]?.[1] as { body: FormData }).body;
}

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

describe("ProfilePhotoUploader", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getMediaUploadSignature.mockReset().mockResolvedValue(SIGNATURE);
    updateProfilePhoto.mockReset().mockResolvedValue(null);
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ secure_url: "https://cdn.test/portrait.jpg" }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("will not upload until a photograph has been chosen", async () => {
    const user = typist();
    render(<ProfilePhotoUploader currentUrl={null} displayName="Mary" />);

    expect(screen.getByRole("button", { name: /save photograph/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /save photograph/i }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  /** The regression. Every signed parameter has to travel with the file. */
  it("sends every parameter the signature covers, transformation included", async () => {
    const user = typist();
    const { container } = render(<ProfilePhotoUploader currentUrl={null} displayName="Mary" />);
    await choose(container);

    await user.click(screen.getByRole("button", { name: /save photograph/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const body = sentToCloudinary(fetchMock);
    expect(body.get("transformation")).toBe(SIGNATURE.transformation);
    expect(body.get("folder")).toBe(SIGNATURE.folder);
    expect(body.get("timestamp")).toBe(String(SIGNATURE.timestamp));
    expect(body.get("api_key")).toBe(SIGNATURE.apiKey);
    expect(body.get("signature")).toBe(SIGNATURE.signature);
    expect(body.get("file")).toBeInstanceOf(File);
  });

  it("asks for a signature scoped to the profiles folder", async () => {
    const user = typist();
    const { container } = render(<ProfilePhotoUploader currentUrl={null} displayName="Mary" />);
    await choose(container);

    await user.click(screen.getByRole("button", { name: /save photograph/i }));

    await waitFor(() => {
      expect(getMediaUploadSignature).toHaveBeenCalledWith("profiles");
    });
  });

  it("records the new photograph against the account once it is stored", async () => {
    const user = typist();
    const { container } = render(<ProfilePhotoUploader currentUrl={null} displayName="Mary" />);
    await choose(container);

    await user.click(screen.getByRole("button", { name: /save photograph/i }));

    await waitFor(() => {
      expect(updateProfilePhoto).toHaveBeenCalledWith("https://cdn.test/portrait.jpg");
    });
    expect(await screen.findByText(/profile photograph updated/i)).toBeInTheDocument();
  });

  /** Cloudinary explains itself; repeating its words beats inventing ours. */
  it("repeats the image host's own reason for a refusal", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: "Invalid Signature" } }),
    });
    const user = typist();
    const { container } = render(<ProfilePhotoUploader currentUrl={null} displayName="Mary" />);
    await choose(container);

    await user.click(screen.getByRole("button", { name: /save photograph/i }));

    expect(await screen.findByText(/invalid signature/i)).toBeInTheDocument();
    expect(updateProfilePhoto).not.toHaveBeenCalled();
  });

  it("says so when the account could not be updated, even though the upload worked", async () => {
    updateProfilePhoto.mockResolvedValue("Your session has expired.");
    const user = typist();
    const { container } = render(<ProfilePhotoUploader currentUrl={null} displayName="Mary" />);
    await choose(container);

    await user.click(screen.getByRole("button", { name: /save photograph/i }));

    expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
  });

  it("shows the photograph already on the account before a new one is chosen", () => {
    const { container } = render(
      <ProfilePhotoUploader currentUrl="https://cdn.test/current.jpg" displayName="Mary" />,
    );

    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://cdn.test/current.jpg");
  });
});
