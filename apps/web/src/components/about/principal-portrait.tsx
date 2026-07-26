import { existsSync } from "node:fs";
import { join } from "node:path";

import Image from "next/image";

import { Icon } from "@kedland/ui";

const PRINCIPAL_IMAGE_CANDIDATES = [
  "/images/principal-mary.webp",
  "/images/principal-mary.jpg",
  "/images/principal-mary.jpeg",
  "/images/principal-mary.png",
  "/images/principal.webp",
  "/images/principal.jpg",
] as const;

function availablePrincipalImage(): string | null {
  const publicRoot = join(process.cwd(), "public");
  return (
    PRINCIPAL_IMAGE_CANDIDATES.find((candidate) =>
      existsSync(join(publicRoot, candidate.replace(/^\//, ""))),
    ) ?? null
  );
}

interface PrincipalPortraitProps {
  alt: string;
  className?: string;
  sizes?: string;
}

/** Uses Mary's approved photo when supplied; never presents the crest as her portrait. */
export function PrincipalPortrait({
  alt,
  className = "",
  sizes = "(min-width: 768px) 22rem, 80vw",
}: Readonly<PrincipalPortraitProps>) {
  const source = availablePrincipalImage();

  return (
    <span
      className={`relative block overflow-hidden bg-sky/30 ${className}`.trim()}
      data-principal-photo={source ? "available" : "pending"}
    >
      {source ? (
        <Image src={source} alt={alt} fill sizes={sizes} className="object-cover object-top" />
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
