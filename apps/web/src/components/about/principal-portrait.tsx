import Image from "next/image";

import { Icon } from "@kedland/ui";

interface PrincipalPortraitProps {
  alt: string;
  src?: string | undefined;
  className?: string;
  sizes?: string;
}

/** Uses the CMS-approved photo when supplied; never presents the crest as her portrait. */
export function PrincipalPortrait({
  alt,
  src,
  className = "",
  sizes = "(min-width: 768px) 22rem, 80vw",
}: Readonly<PrincipalPortraitProps>) {
  return (
    <span
      className={`relative block overflow-hidden bg-sky/30 ${className}`.trim()}
      data-principal-photo={src ? "available" : "pending"}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover object-top" />
      ) : (
        <span
          role="img"
          aria-label={alt}
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-sky/55 to-white p-6 text-center text-navy"
        >
          <Icon name="user" className="size-16 text-blue/65" />
          <span className="mt-4 font-display text-h3 font-bold">Principal photograph</span>
          <span className="mt-1 text-small text-grey">Approved portrait pending</span>
        </span>
      )}
    </span>
  );
}
