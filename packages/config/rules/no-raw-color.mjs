/**
 * Bans raw colour literals in application code.
 *
 * The Kedland palette is fixed and accessibility-audited (agent_plan §2.2, and
 * the source of truth is the build package's brand-tokens.css). Every colour a
 * component uses must come from a token, so that a contrast fix lands in one
 * place instead of thirty. A stray `#0B4A6D` is how palettes rot.
 *
 * Detects: hex (#abc, #aabbcc, #aabbccdd), and the functional colour notations
 * rgb/rgba/hsl/hsla/oklch/oklab/lab/lch/color-mix.
 *
 * Allowed by design:
 *   - the token definition files themselves (configured via `ignores` in the
 *     consuming ESLint config — see packages/ui)
 *   - `transparent`, `currentColor`, `inherit`, `none` (not literals we match)
 *   - anything listed in the rule's `allow` option
 */

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const FUNCTIONAL = /\b(?:rgba?|hsla?|hwb|okla[bc]|oklch|la[bc]|lch|color-mix)\s*\(/i;

/** SVG path data and gradients legitimately contain no colours; keep the check narrow. */
function findViolation(text, allow) {
  if (typeof text !== "string" || text.length === 0) return null;
  if (allow.some((a) => text.includes(a))) return null;

  const hex = HEX.exec(text);
  if (hex) return hex[0];

  const fn = FUNCTIONAL.exec(text);
  if (fn) return fn[0].trim();

  return null;
}

/** @type {import("eslint").Rule.RuleModule} */
export const noRawColor = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow raw colour literals; use a brand token instead",
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      rawColor:
        'Raw colour "{{color}}" is not allowed. Use a brand token (e.g. var(--navy), text-navy) — see agent_plan.md §2.2.',
    },
  },

  create(context) {
    const allow = context.options[0]?.allow ?? [];

    function check(node, text) {
      const color = findViolation(text, allow);
      if (color !== null) {
        context.report({ node, messageId: "rawColor", data: { color } });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
    };
  },
};

/** @type {import("eslint").ESLint.Plugin} */
export default {
  meta: { name: "@kedland/eslint-plugin-brand", version: "0.1.0" },
  rules: { "no-raw-color": noRawColor },
};
