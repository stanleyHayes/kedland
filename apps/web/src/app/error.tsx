"use client";

/**
 * Segment error boundary. Client component by requirement — Next needs the
 * `reset` handler to run in the browser.
 *
 * A parent who hits this still needs a way to reach the school, so the phone
 * numbers are here rather than only on the contact page they cannot load.
 */
export default function RouteError({ reset }: Readonly<{ error: Error; reset: () => void }>) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1>Something went wrong</h1>
      <p className="mt-4 text-grey">
        Sorry — that did not load. Please try again, or call us on{" "}
        <a href="tel:+233257130333" className="text-blue underline">
          +233 257 130 333
        </a>
        .
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-pill bg-red px-7 py-3.5 font-display font-bold text-white shadow-card transition-transform hover:scale-104"
      >
        Try again
      </button>
    </section>
  );
}
