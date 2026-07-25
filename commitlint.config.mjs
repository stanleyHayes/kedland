/**
 * Conventional Commits.
 *
 * The scope list mirrors the workspace so `git log --oneline` reads as a
 * history of the system rather than a list of adjectives.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      ["web", "admin", "api", "types", "ui", "config", "testing", "ci", "deps", "docs", "repo"],
    ],
    "subject-case": [2, "never", ["upper-case", "pascal-case", "start-case"]],
    "body-max-line-length": [1, "always", 120],
  },
};
