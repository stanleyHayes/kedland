# Translating Design Feedback Into Rules

Use this reference to infer the design intent behind short or subjective requests.

| Feedback or request                                        | Interpret it as                                                                  | Respond by                                                                                                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| “Move things around. Change anything as you please.”       | Broad composition freedom, not permission to discard the brand or functionality. | Rebuild hierarchy, section order, layout rhythm, and interactions confidently; preserve routes, content contracts, and Kedland identity.      |
| “What you designed has vanished” or “nothing changed.”     | Runtime proof is missing or the wrong shell/route/server is being viewed.        | Inspect the exact URL in the browser, active process, cache, layout nesting, and rendered DOM before claiming a fix.                          |
| “Redesign the cards.”                                      | The repeated component language feels generic or unfinished.                     | Change hierarchy, iconography, surface treatment, spacing, and card roles; do more than adjust shadow or colour.                              |
| “Add placeholders and start and end icons where possible.” | Forms should teach users what to enter and feel deliberately designed.           | Keep labels, add useful examples, semantic leading icons, and functional trailing icons only where they clarify state or action.              |
| “The borders of the inputs are too rounded.”               | Rounded warmth has crossed into capsule monotony.                                | Use about `10px–12px` radii for fields; reserve pills for buttons, chips, and nav capsules.                                                   |
| “I need cool watermarks.”                                  | Background decoration should reinforce page meaning.                             | Use large, low-opacity, page-specific semantic icons or marks, carefully cropped and responsive.                                              |
| “I need exactly this shape.”                               | Visual geometry is a requirement, not a loose inspiration.                       | Model the silhouette with SVG, mask, clip-path, or pseudo-elements; render and compare at the reference ratio and mobile widths.              |
| “Include more content that will lead to other pages.”      | Improve site journey and discovery, not word count.                              | Add a visual route guide with concise promises and real links; avoid generic filler copy.                                                     |
| “This place should be the image of the Principal.”         | The content is human and identity-bearing.                                       | Use the approved portrait or a clearly labelled missing-asset state; never substitute the crest or fabricate a person.                        |
| “The landing page has to be special.”                      | The first impression needs a signature moment.                                   | Create a distinctive hero composition, concentrated text animation, layered brand shapes, and a clear path onward.                            |
| “Currently it is heavy text.”                              | Information hierarchy and media balance are weak.                                | Shorten copy, use image-led storytelling, route cards, pull quotes, stats only when verified, and varied section formats.                     |
| “Finally polish.”                                          | The concept is accepted; consistency and details need attention.                 | Refine alignment, responsive behavior, focus/hover states, copy wrapping, card heights, crops, and shared tokens without reopening the brand. |

## What this user tends to find beautiful

- Strong navy grounds animated by yellow, red, pink, sky, and cream accents.
- Large friendly type with intentional line breaks.
- Asymmetric, organic, swept, or wavy silhouettes.
- Meaningful icon watermarks that make a surface feel custom.
- Cards with distinct roles rather than repetitive identical containers.
- Real human photography used as a visual anchor.
- A clear journey from a strong landing moment into deeper pages.
- Motion that makes the hero memorable without making the site restless.
- Friendly forms with examples, icons, and confident but not over-rounded controls.
- Designs that are visibly and boldly improved, not merely nudged.

## Tensions to resolve

When playfulness conflicts with trust, simplify the information structure first and retain one expressive visual gesture. When exact reference matching conflicts with responsiveness, preserve the recognizable silhouette and adapt its crop rather than stretching it. When more content conflicts with text heaviness, add navigational or image-led content instead of paragraphs.
