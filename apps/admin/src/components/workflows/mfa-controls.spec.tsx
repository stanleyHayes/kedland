import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const beginMfaEnrolment = vi.fn();
const enableMfa = vi.fn();
const disableMfa = vi.fn();

vi.mock("@/app/(dashboard)/actions", () => ({ beginMfaEnrolment, enableMfa, disableMfa }));

const { MfaControls } = await import("./mfa-controls");

const ENROLMENT = {
  secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
  uri: "otpauth://totp/Kedland%3Amary%40kedland.edu.gh?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
};

const CODES = ["AKND-ER93", "QRST-2468", "WXYZ-3579"];

describe("MfaControls", () => {
  beforeEach(() => {
    beginMfaEnrolment.mockReset().mockResolvedValue(ENROLMENT);
    enableMfa.mockReset().mockResolvedValue(CODES);
    disableMfa.mockReset().mockResolvedValue(undefined);
  });

  /**
   * A deployment with no encryption key must say so, rather than offering a
   * button that fails on the first press.
   */
  it("explains itself when the server cannot store secrets", () => {
    render(<MfaControls enabled={false} available={false} />);

    expect(screen.getByText(/not configured on this server/i)).toBeInTheDocument();
    expect(screen.getByText("MFA_ENCRYPTION_KEY")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /set up/i })).not.toBeInTheDocument();
  });

  describe("enrolling", () => {
    it("offers to start when two-factor is off", () => {
      render(<MfaControls enabled={false} available />);

      expect(screen.getByRole("button", { name: /set up two-factor/i })).toBeInTheDocument();
    });

    it("shows the key and a link to the app after starting", async () => {
      render(<MfaControls enabled={false} available />);
      await userEvent.click(screen.getByRole("button", { name: /set up two-factor/i }));

      // Grouped in fours, because a 32-character run gets transcribed wrongly.
      expect(screen.getByText(/GEZD GNBV/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /open in your authenticator/i })).toHaveAttribute(
        "href",
        ENROLMENT.uri,
      );
    });

    it("sends the code with the secret it was issued", async () => {
      render(<MfaControls enabled={false} available />);
      await userEvent.click(screen.getByRole("button", { name: /set up two-factor/i }));
      await userEvent.type(screen.getByLabelText(/six-digit code/i), "123456");
      await userEvent.click(screen.getByRole("button", { name: "Turn on" }));

      expect(enableMfa).toHaveBeenCalledWith(ENROLMENT.secret, "123456");
    });

    it("shows the recovery codes once it is on", async () => {
      render(<MfaControls enabled={false} available />);
      await userEvent.click(screen.getByRole("button", { name: /set up two-factor/i }));
      await userEvent.type(screen.getByLabelText(/six-digit code/i), "123456");
      await userEvent.click(screen.getByRole("button", { name: "Turn on" }));

      for (const code of CODES) expect(screen.getByText(code)).toBeInTheDocument();
      expect(screen.getByText(/shown now and never again/i)).toBeInTheDocument();
    });

    /** A rejected code must not advance, or the codes step would show nothing. */
    it("reports a rejected code and stays put", async () => {
      enableMfa.mockRejectedValue(new Error("That code did not match."));
      render(<MfaControls enabled={false} available />);
      await userEvent.click(screen.getByRole("button", { name: /set up two-factor/i }));
      await userEvent.type(screen.getByLabelText(/six-digit code/i), "000000");
      await userEvent.click(screen.getByRole("button", { name: "Turn on" }));

      expect(await screen.findByText("That code did not match.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Turn on" })).toBeInTheDocument();
    });

    it("can be abandoned without enabling anything", async () => {
      render(<MfaControls enabled={false} available />);
      await userEvent.click(screen.getByRole("button", { name: /set up two-factor/i }));
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(enableMfa).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /set up two-factor/i })).toBeInTheDocument();
    });

    it("says when the enrolment could not be started", async () => {
      beginMfaEnrolment.mockRejectedValue(new Error("Two-factor is not configured."));
      render(<MfaControls enabled={false} available />);
      await userEvent.click(screen.getByRole("button", { name: /set up two-factor/i }));

      expect(await screen.findByText("Two-factor is not configured.")).toBeInTheDocument();
    });
  });

  describe("turning it off", () => {
    /**
     * Otherwise anyone at an unlocked laptop could remove the factor protecting
     * it, which would make the whole thing decorative.
     */
    it("asks for the password", () => {
      render(<MfaControls enabled available />);

      expect(screen.getByLabelText("Your password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /turn off/i })).toBeInTheDocument();
    });

    it("sends the password", async () => {
      render(<MfaControls enabled available />);
      await userEvent.type(screen.getByLabelText("Your password"), "the-real-password");
      await userEvent.click(screen.getByRole("button", { name: /turn off/i }));

      expect(disableMfa).toHaveBeenCalledWith("the-real-password");
    });

    it("reports a wrong password rather than appearing to succeed", async () => {
      disableMfa.mockRejectedValue(new Error("That password is not correct."));
      render(<MfaControls enabled available />);
      await userEvent.type(screen.getByLabelText("Your password"), "wrong");
      await userEvent.click(screen.getByRole("button", { name: /turn off/i }));

      expect(await screen.findByText("That password is not correct.")).toBeInTheDocument();
    });
  });
});
