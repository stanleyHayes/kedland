# Kedland Visual Language

## North star

> A three-year-old should smile at it, and their parent should trust it.

Translate this into bright warmth, bold friendliness, institutional clarity, and deliberate restraint. The site may be playful without looking like a toy; polished without looking corporate; expressive without becoming noisy.

## Brand character

- **Warm:** sound welcoming rather than formal or distant.
- **Playful:** use colour, organic geometry, illustration, and motion with purpose.
- **Trustworthy:** make information easy to scan, forms easy to complete, and next steps unmistakable.
- **Confident:** use large type, decisive section shapes, and clear hierarchy.
- **Human:** lead with real children, staff, learning environments, and specific school stories when approved media exists.

## Colour

Treat the repository tokens as the source of truth. The established system includes:

| Role         | Typical token     | Use                                                  |
| ------------ | ----------------- | ---------------------------------------------------- |
| Primary      | Navy              | Headings, navigation, primary text, structural bands |
| Deep primary | Deep navy         | Dark heroes, footer, high-contrast sections          |
| Optimism     | Yellow            | Eyebrows, highlights, small fields of joy            |
| Energy       | Red to pink       | Primary CTA gradients, accents, active moments       |
| Air          | Sky and pale blue | Field borders, soft backgrounds, calm panels         |
| Growth       | Green             | Nature, progress, positive indicators                |
| Warm ground  | Cream             | Page canvas, alternating sections, visual softness   |
| Neutral      | Ink, grey, white  | Reading hierarchy and surfaces                       |

Use colour in broad, confident fields rather than sprinkling every colour into every component. Keep accessible text contrast. On yellow or sky surfaces, prefer navy or ink text.

## Typography

- Use the configured display face for headlines, buttons, and strong section labels.
- Use the configured body/UI face for paragraphs, labels, navigation, and form controls.
- Prefer short display lines with deliberate wrapping over oversized text walls.
- Use sentence case for most headings; use uppercase sparingly for small eyebrows.
- Keep body copy comfortably readable, with moderate line length and generous leading.

If the repository has evolved away from an earlier font pairing, follow the current tokens and do not reintroduce old fonts merely because an older brief names them.

## Shape hierarchy

Use shape to communicate component role:

- Inputs and textareas: approximately `10px–12px` radius.
- Compact cards: approximately `16px–20px` radius.
- Feature cards and editorial panels: approximately `24px–32px` radius when scale warrants it.
- Pills: `999px` only for buttons, chips, small navigation capsules, and status labels.
- Hero and section silhouettes: organic waves, swept corners, soft cut-outs, asymmetric curves, or layered SVG paths.

Avoid giving fields, cards, panels, and buttons the same capsule silhouette. Rounded does not mean pill-shaped.

## Composition and rhythm

- Use one dominant idea per section.
- Alternate dense and quiet bands.
- Allow controlled overlap between image and colour surfaces.
- Use asymmetric grids and offset cards to keep the page lively.
- Align text consistently even when outer geometry is organic.
- Keep generous breathing room around important information.
- Use equal-height behavior when sibling cards need to read as one set.

A good page often moves through:

1. A distinctive hero with one promise and one action.
2. A fast proof or orientation band.
3. A visual route guide to related pages.
4. An image-led story or editorial section.
5. A reassuring practical section.
6. A decisive closing CTA.

Vary this sequence by page intent; do not turn it into a rigid template.

## Watermarks and decorative marks

Use watermarks as quiet storytelling:

- Select a semantic icon tied to the page or card: book for learning, compass for journey, heart for care, flask for discovery, clock for office hours.
- Keep page watermarks large and partially cropped; keep card watermarks smaller and anchored to a corner.
- Use roughly `4%–8%` opacity depending on contrast and scale.
- Place watermarks behind content with `pointer-events: none` and `aria-hidden="true"`.
- Keep text contrast unchanged when the watermark is removed; it is enhancement, not content.
- Use a consistent stroke language and weight.

Avoid generic repeated stars, unrelated blobs, loud foreground icons, or marks that collide with copy at narrow widths.

## Imagery

- Prefer approved, real photography over illustration where identity and trust matter.
- Feature the Principal with a real portrait, name, role, and human editorial treatment.
- Use environmental images to break up text-heavy pages and demonstrate learning, play, facilities, and community.
- Crop intentionally around faces and activity; define `object-position` per image when needed.
- Provide meaningful alt text for informative images and empty alt text for decorative images.
- Never treat a logo as a person's portrait.
- Never generate or source unapproved pupil imagery as if it belongs to the school.

## Motion

Make the landing page feel special with a restrained motion signature:

- Stagger hero words or short phrases on entrance.
- Add one subtle gradient shine, underline draw, spark, or floating motif.
- Reveal supporting elements with small opacity/translate transitions.
- Use hover lift and arrow movement to signal interactive cards.
- Keep timing quick and calm; avoid continuous motion across the whole page.
- Disable or simplify nonessential motion under `prefers-reduced-motion: reduce`.

Do not hide essential content until animation completes. Avoid typewriter effects on long copy, bouncing every card, or combining several competing animation styles.

## Responsive behavior

- Recompose rather than merely shrink.
- Stack split heroes with copy before supporting media unless the media is the page's primary content.
- Turn complex grids into one strong column with varied internal card layouts.
- Preserve comfortable tap targets and reading widths.
- Reduce watermark scale or crop it more aggressively when it competes with copy.
- Check unusual swept shapes and SVG paths at narrow widths; geometry that looks correct on desktop often clips on mobile.

## Accessibility and trust

- Meet WCAG AA contrast for text and interactive elements.
- Keep visible focus states in the Kedland palette.
- Associate every field with a label; placeholders supplement labels rather than replace them.
- Use semantic headings in logical order.
- Keep button and link language specific: “Explore Primary,” “Book a visit,” or “Send enquiry.”
- Make validation and error states clear without relying on colour alone.
