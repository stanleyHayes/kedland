/** Keep a leading international `+`, discard punctuation, and cap at E.164's 15 digits. */
function cleanPhone(value: string): { international: boolean; digits: string } {
  const international = value.trimStart().startsWith("+");
  return {
    international,
    digits: value.replace(/\D/g, "").slice(0, 15),
  };
}

function grouped(value: string, sizes: readonly number[]): string {
  const groups: string[] = [];
  let offset = 0;

  for (const size of sizes) {
    const part = value.slice(offset, offset + size);
    if (part) groups.push(part);
    offset += size;
  }

  for (; offset < value.length; offset += 3) {
    groups.push(value.slice(offset, offset + 3));
  }

  return groups.join(" ");
}

/**
 * Formats Ghanaian local and international numbers as they are typed.
 *
 * Examples: `0501358915` → `050 135 8915`, and
 * `+233501358915` → `+233 50 135 8915`.
 */
export function formatPhoneNumber(value: string): string {
  const { international, digits } = cleanPhone(value);
  if (!digits) return international ? "+" : "";

  if (international && digits.startsWith("233")) {
    const national = digits.slice(3);
    return national ? `+233 ${grouped(national, [2, 3, 4])}` : "+233";
  }

  if (international) return `+${grouped(digits, [3, 3, 3])}`;
  if (digits.startsWith("0")) return grouped(digits, [3, 3, 4]);
  return grouped(digits, [3, 3, 4]);
}

/** Canonical value for links or APIs that prefer punctuation-free numbers. */
export function normalizePhoneNumber(value: string): string {
  const { international, digits } = cleanPhone(value);
  return `${international ? "+" : ""}${digits}`;
}
