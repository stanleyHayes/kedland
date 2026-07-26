import Image from "next/image";
import Link from "next/link";

import { Icon, buttonClasses } from "@kedland/ui";

export default function NotFound() {
  return (
    <section className="mx-auto grid min-h-[65dvh] max-w-3xl place-items-center py-12 text-center">
      <div className="admin-panel relative w-full overflow-hidden rounded-lg px-6 py-14 sm:px-12">
        <Icon
          name="map-pin"
          strokeWidth={1}
          className="pointer-events-none absolute -bottom-14 -right-10 size-56 text-navy opacity-[0.035]"
        />
        <p className="pointer-events-none absolute inset-x-0 top-4 font-display text-[7rem] font-extrabold leading-none text-sky/20">
          404
        </p>
        <span className="admin-icon-button relative mx-auto mt-10 grid size-20 place-items-center bg-cream p-2 text-red-text">
          <Image
            src="/logo/kedland-logo-256.png"
            alt=""
            width={256}
            height={256}
            className="size-full object-contain"
          />
        </span>
        <p className="relative mt-5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-red-text">
          Workspace route unavailable
        </p>
        <h1 className="relative mt-2">Page not found</h1>
        <p className="relative mx-auto mt-3 max-w-md text-grey">
          That dashboard destination does not exist or is not available to this account.
        </p>
        <Link href="/" className={buttonClasses({ size: "sm", className: "relative mt-7 !rounded-md" })}>
          Back to the overview
        </Link>
      </div>
    </section>
  );
}
