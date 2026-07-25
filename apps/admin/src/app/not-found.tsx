import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1>Page not found</h1>
      <p className="mt-4 text-grey">That dashboard page does not exist.</p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-pill bg-navy px-7 py-3.5 font-display font-bold text-white"
      >
        Back to the overview
      </Link>
    </section>
  );
}
