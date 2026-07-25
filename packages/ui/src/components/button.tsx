import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Buttons, per build package §2.5: pill-shaped, chunky padding, bold display
 * type, soft shadow, a gentle scale on hover, and a tap target no smaller than
 * 48px — parents use this site on phones.
 *
 * Styling is exported as `buttonClasses()` as well as a `<Button>` component,
 * because half the "buttons" on this site are really links (Enrol Now goes to
 * /admissions). A link that renders as a button should still be an `<a>`, so
 * screen readers and middle-click both behave.
 */

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  // The reference navbar's gradient CTA, in Kedland's red. `--red` is the
  // approved CTA colour; the pink is the same family and keeps white text
  // above 4.5:1 across the whole sweep.
  primary: "bg-linear-to-r from-red to-pink text-white shadow-card hover:shadow-lift",
  secondary: "bg-navy text-white shadow-card hover:shadow-lift",
  tertiary: "bg-yellow text-ink shadow-card hover:shadow-lift",
  outline: "border-2 border-navy bg-transparent text-navy hover:bg-navy hover:text-white",
};

const SIZES: Record<ButtonSize, string> = {
  // Every size clears the 48px minimum tap target.
  sm: "min-h-12 px-5 py-2.5 text-small",
  md: "min-h-12 px-7 py-3.5",
  lg: "min-h-14 px-9 py-4 text-h3",
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** The shared class string, for links that should look like buttons. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
}: ButtonStyleOptions = {}): string {
  return [
    "inline-flex items-center justify-center gap-2.5 rounded-pill font-display font-bold",
    "transition-[transform,box-shadow,background-color,color] duration-200",
    "hover:scale-104 active:scale-100",
    "disabled:pointer-events-none disabled:opacity-55",
    // The scale is decoration; a visitor who asked for less motion gets none.
    "motion-reduce:transform-none motion-reduce:transition-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  ]
    .join(" ")
    .trim();
}

/**
 * The circular arrow chip from the reference navbar's CTA.
 *
 * Decorative — the button's own text already says where it goes, so announcing
 * "arrow" would just add noise.
 */
export function ArrowChip({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-7 shrink-0 place-items-center rounded-pill bg-white/25 ${className}`.trim()}
    >
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export interface ButtonProps
  // `className` comes from ButtonStyleOptions. Inheriting both declarations
  // conflicts under `exactOptionalPropertyTypes`, where `string | undefined`
  // and `string` are genuinely different optional types.
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">, ButtonStyleOptions {
  children: ReactNode;
  /** Adds the circular arrow chip used on the header's Enrol Now button. */
  withArrow?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  withArrow = false,
  type = "button",
  ...rest
}: Readonly<ButtonProps>) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...rest}>
      {children}
      {withArrow && <ArrowChip />}
    </button>
  );
}
