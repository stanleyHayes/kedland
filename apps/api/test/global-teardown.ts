export default async function globalTeardown(): Promise<void> {
  await globalThis.__KEDLAND_MONGO__?.stop();
  globalThis.__KEDLAND_MONGO__ = undefined;
}
