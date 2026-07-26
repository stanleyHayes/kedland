import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EnquiryForm } from "./enquiry-form";

/**
 * The enquiry form.
 *
 * The behaviour worth pinning down is what happens when things go wrong: a
 * parent who cannot tell why the form will not submit, or who is told their
 * message failed when it did not, is a lost enrolment.
 */

const API = "http://api.test/api/v1";

function renderForm(siteKey?: string) {
  return render(<EnquiryForm apiUrl={API} turnstileSiteKey={siteKey} />);
}

/** Fills in every required field with something valid. */
async function fillIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/your name/i), "Ama Mensah");
  await user.type(screen.getByLabelText(/email/i), "ama@example.com");
  await user.type(screen.getByLabelText(/phone/i), "0241234567");
  await user.type(screen.getByLabelText(/your message/i), "Please may I book a tour?");
}

describe("EnquiryForm", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202 });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("labels every control, so nobody has to guess from a placeholder", () => {
    renderForm();

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/what is this about/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/which class/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your message/i)).toBeInTheDocument();
  });

  it("sends the enquiry to the API", async () => {
    const user = userEvent.setup();
    renderForm();
    await fillIn(user);

    await user.click(screen.getByRole("button", { name: /send enquiry/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(`${API}/enquiries`, expect.anything());
    });
  });

  it("thanks the parent once it is sent", async () => {
    const user = userEvent.setup();
    renderForm();
    await fillIn(user);

    await user.click(screen.getByRole("button", { name: /send enquiry/i }));

    expect(await screen.findByText(/we have your message/i)).toBeInTheDocument();
  });

  /**
   * The confirmation replaces the form. A visitor using a screen reader has no
   * other way to know that happened, so it has to be announced.
   */
  it("announces the confirmation rather than only showing it", async () => {
    const user = userEvent.setup();
    renderForm();
    await fillIn(user);

    await user.click(screen.getByRole("button", { name: /send enquiry/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/we have your message/i);
  });

  it("still offers a phone number on the confirmation, for anything urgent", async () => {
    const user = userEvent.setup();
    renderForm();
    await fillIn(user);

    await user.click(screen.getByRole("button", { name: /send enquiry/i }));

    expect(await screen.findByRole("link", { name: /\+233/ })).toHaveAttribute("href", "tel:+233257130333");
  });

  describe("when something is wrong", () => {
    it("says what, next to the field, rather than failing silently", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByLabelText(/your name/i), "Ama");
      await user.type(screen.getByLabelText(/email/i), "not-an-email");
      await user.type(screen.getByLabelText(/phone/i), "0241234567");
      await user.type(screen.getByLabelText(/your message/i), "Hello");

      await user.click(screen.getByRole("button", { name: /send enquiry/i }));

      expect(screen.getByLabelText(/email/i)).toHaveAttribute("aria-invalid", "true");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("ties the message to the field it belongs to", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByLabelText(/email/i), "nope");
      await user.click(screen.getByRole("button", { name: /send enquiry/i }));

      const email = screen.getByLabelText(/email/i);
      const describedBy = email.getAttribute("aria-describedby");

      // Colour alone would leave a screen-reader user with no idea what is
      // wrong; the message has to be reachable from the control.
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy ?? "")).toHaveTextContent(/\S/);
    });

    it("clears the message as soon as the parent starts fixing it", async () => {
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByLabelText(/email/i), "nope");
      await user.click(screen.getByRole("button", { name: /send enquiry/i }));
      expect(screen.getByLabelText(/email/i)).toHaveAttribute("aria-invalid", "true");

      await user.type(screen.getByLabelText(/email/i), "@example.com");

      expect(screen.getByLabelText(/email/i)).not.toHaveAttribute("aria-invalid");
    });

    it("tells the parent, and gives them the phone number, when the API is down", async () => {
      fetchMock.mockRejectedValue(new Error("offline"));
      const user = userEvent.setup();
      renderForm();
      await fillIn(user);

      await user.click(screen.getByRole("button", { name: /send enquiry/i }));

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(/could not send/i);
      expect(alert).toHaveTextContent(/\+233 257 130 333/);
    });

    it("does not claim success when the API rejects the enquiry", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 400 });
      const user = userEvent.setup();
      renderForm();
      await fillIn(user);

      await user.click(screen.getByRole("button", { name: /send enquiry/i }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.queryByText(/we have your message/i)).not.toBeInTheDocument();
    });
  });

  describe("Turnstile", () => {
    /**
     * No site key is the local and preview case. The form must still work —
     * the API only demands a token when it has a secret of its own.
     */
    it("submits normally when no site key is configured", async () => {
      const user = userEvent.setup();
      renderForm();
      await fillIn(user);

      await user.click(screen.getByRole("button", { name: /send enquiry/i }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });
    });
  });

  it("offers 'not sure yet' as a real answer for the class", () => {
    const { container } = renderForm();

    expect(container.querySelector('input[name="level"]')).toHaveValue("not-sure");
    expect(screen.getByLabelText(/which class/i)).toHaveTextContent("Not sure yet");
  });

  it("formats a Ghanaian phone number as it is typed", async () => {
    const user = userEvent.setup();
    renderForm();

    const phone = screen.getByLabelText(/phone/i);
    await user.type(phone, "0501358915");

    expect(phone).toHaveValue("050 135 8915");
  });

  it("asks for nothing that identifies a child", () => {
    renderForm();

    // The form is an enquiry, not an admission. Admissions happen on paper at
    // the office, which is what keeps children's data off this site entirely.
    expect(screen.queryByLabelText(/child.*name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/date of birth/i)).not.toBeInTheDocument();
  });
});
