# Kedland Component Recipes

Use these as design recipes, not mandatory templates. Adapt the hierarchy to the page's job.

## Hero

Build the hero around one emotional promise and one next step.

- Use a compact eyebrow, strong display heading, short supporting sentence, and one primary CTA.
- Add one secondary link only when it has a distinct purpose.
- Use a bold colour field, organic silhouette, meaningful watermark, or approved image as the visual anchor.
- Animate selected words or accents, not the entire section.
- Keep mobile copy visible without requiring the image to load.

For a reference-matched shape, prefer an SVG path or pseudo-element whose geometry is explicit. Test at the exact screenshot aspect ratio and at responsive widths. CSS `border-radius` alone rarely reproduces a swept tapered end accurately.

## Visual route guide

Use when a page needs to lead visitors into related areas.

- Create three to six route cards with semantic icons or imagery.
- Give each card a short title, one-line promise, and directional affordance.
- Vary accent colours or composition while preserving a common grid rhythm.
- Use real routes and existing navigation labels.
- Avoid adding a wall of explanatory text above the cards.

## Cards

- Start with a strong information hierarchy: icon or image, label, title, supporting line, action.
- Use `16px–20px` radii for most utility cards; reserve larger radii for editorial features.
- Use borders, colour blocks, image crops, or asymmetric accents so every set is not a white-card grid.
- Keep sibling cards equal height when comparison matters.
- Add a restrained semantic watermark only when it contributes meaning.
- Move an arrow or lift the card slightly on hover; keep the entire card focusable when it is one destination.

## Forms

- Keep persistent labels above fields.
- Add useful placeholders: examples, expected formats, or short prompts.
- Use start icons for field meaning: person, mail, phone, message.
- Use end icons for affordance or state: chevron for selects, validation state, reveal password.
- Use approximately `10px` radius, visible borders, generous padding, and a strong focus ring.
- Keep helper text close to its field and error text programmatically associated.
- Make the submit action visually decisive without making it enormous.

Do not add decorative icons that confuse the input's purpose. Do not use placeholders as labels.

## Principal feature

- Use an approved portrait as the focal point.
- Pair it with a warm excerpt, name, role, and a route to the full message.
- Treat the section editorially: split composition, shaped image frame, pull quote, or signature detail.
- Keep the school crest as a supporting brand mark only.
- If the portrait asset is unavailable, show an intentional asset placeholder and document the expected path or CMS field.

## Facilities or feature grid

- Pair each facility with a meaningful icon or approved photo.
- Use a responsive three-column grid on wide screens, two columns when appropriate, and one column on narrow screens.
- Avoid nine identical capsules with the same star icon.
- Introduce hierarchy through featured items, colour, small descriptions, or varied spans while keeping scanning easy.

## Contact experience

- Separate the main enquiry form from practical contact cards.
- Make office hours, phone/WhatsApp, location, and email actionable.
- Use semantic icons and clear labels.
- Keep the form card spacious but avoid excessive outer rounding.
- Provide a clear success, error, and troubleshooting path without exposing raw fallback links in normal state.

## News landing and detail

- Lead with a featured story or editorial image rather than a generic card wall.
- Use category/date metadata as supporting information, not visual noise.
- Keep listing cards scannable and varied through image ratio or emphasis.
- On detail pages, prioritize reading width, image captions, related stories, and a clear return path.
- Ensure decorative watermarks do not sit beneath long-form body text.

## Footer

- Treat the footer as a final orientation surface, not a link dump.
- Use a deep navy foundation, clear grouped links, practical contact details, and one warm CTA.
- Keep the logo readable and unboxed unless the composition explicitly needs a sticker treatment.
- Use a wavy or organic top edge carefully; preserve sufficient space above the first content row.

## Header and brand lockup

- Use the native crest and wordmark proportions.
- Keep the navigation easy to scan and the enrolment CTA visually distinct.
- Use the swept logo panel only when its geometry remains clean at all breakpoints.
- Recreate reference geometry with an explicit SVG or mask when exact matching is requested.
- Keep dropdown and mobile drawer behavior intact while redesigning presentation.

## Runtime review checklist

- The page has one unmistakable primary action.
- The first viewport communicates the page's value without a text wall.
- Related routes are visible where useful.
- Real images are used only when approved and correctly identified.
- Watermarks are semantic, subtle, noninteractive, and responsive.
- Fields have labels, placeholders, appropriate icons, focus states, and moderate radii.
- Cards do not all share the same silhouette and emphasis.
- Motion adds one memorable beat and respects reduced motion.
- Desktop and mobile compositions both feel designed.
- The exact requested route visibly reflects the change.
