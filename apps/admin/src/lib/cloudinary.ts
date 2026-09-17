/**
 * Cloudinary's own message for a refusal, when it sent one.
 *
 * Repeating its words beats inventing ours — a bare "did not accept the
 * image" hid the actual reason (a stale signature, an unsupported format, a
 * missing signed parameter) behind one message that never changed no matter
 * what was actually wrong.
 */
export async function cloudinaryReason(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { error?: { message?: unknown } };
    const message = body.error?.message;
    return typeof message === "string" && message.trim() ? message : null;
  } catch {
    return null;
  }
}
