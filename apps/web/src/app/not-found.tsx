import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1>We could not find that page</h1>
      <p className="mt-4 text-grey">
        The page may have moved, or the link may have a typo. Let us get you back to somewhere useful.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-pill bg-red px-7 py-3.5 font-display font-bold text-white shadow-card transition-transform hover:scale-104"
      >
        Back to the home page
      </Link>
    </section>
  );
}
