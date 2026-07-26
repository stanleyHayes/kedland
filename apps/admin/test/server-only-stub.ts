/**
 * Stands in for the `server-only` package under Vitest.
 *
 * The real package throws when imported outside a React Server Component, so
 * that a mistake becomes a build error. There is no such boundary in a unit
 * test, where the module would only ever be the client build and would always
 * throw. See the alias in `vitest.config.ts`.
 */
export {};
