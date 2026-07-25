# KEDLAND INTERNATIONAL SCHOOL — WEBSITE BUILD PACKAGE

**Prepared by:** XCreativs Technologies
**For:** Development & AI Build Team
**Client:** Kedland International School (KIS) — Lashibi-Tema, Community 19 Annex
**Version:** 1.2 · **Date:** 25 July 2026
**Status:** Build-ready. Content is final copy unless marked `[PENDING — client]` or `[PLACEHOLDER]`.

---

## 0. HOW TO USE THIS PACKAGE

This is the single source of truth for the Kedland website. Read Sections 0–3 in full before writing any code; then build page-by-page from Section 4, wiring in the features from Section 5 and the platform from Section 6.

**Package contents**

```
Kedland_Website_Build_Package.md      ← this document (spec + all page copy)
/assets/logo/                         ← logo, scaled only (never redraw)
   kedland-logo-master-1791.png       ← highest-res transparent master
   kedland-logo-{1024,512,256,192,128,96,64}.png
   kedland-logo.svg                   ← scalable wrapper (exact raster, no redraw)
/assets/favicon/                      ← favicon.ico + PNGs (16–512) + apple-touch-icon
/assets/diagrams/
   eyfs-areas-of-study.svg            ← the 7 EYFS areas honeycomb (on-brand recreation)
```

**Rules for the build team**

- The copy in Section 4 is **final, ship-ready text**. Do not paraphrase or "improve" it without sign-off — it has been written in the school's own voice and approved tone.
- Anything a page needs that the client hasn't supplied yet is tagged `[PENDING — client]` (real data owed by the school) or `[PLACEHOLDER]` (temporary dummy we're using now). Every such tag is collected in **Section 8** — that is the punch list.
- The **look and feel is non-negotiable**: this is a school for **young children — Daycare through Primary 3**. A visitor should feel that within one second of the page loading. Section 2 is the design contract.
- Target architecture is **static / headless** (Section 6). This is deliberate: the previous Kedland site died from uncontrolled multi-user edits on a heavy CMS. We are not repeating that.

**What the client gave us vs. what we generated (gap analysis)**

| Provided by the school                                        | Generated / expanded by XCreativs                                                  |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| About us, Mission, Vision, Motto, Values                      | Full IA & sitemap; all page structure & layout                                     |
| Principal's message                                           | Home page copy, hero lines, CTAs, section headings                                 |
| Student Life (raw notes)                                      | Extensive Student Life page (a day at Kedland, clubs, pastoral care, safeguarding) |
| Curriculum: EYFS (early years) + Cambridge (primary) subjects | Admissions journey & process copy                                                  |
| Level list + services (from flyers)                           | Full FAQ set                                                                       |
| Contacts + location (from flyers)                             | Design system, art direction, component tokens                                     |
| Logo (raster)                                                 | Logo asset set (PNG/SVG/favicon), EYFS diagram recreation                          |

The school is **new**, so several real-world details do not exist yet (staff bios, professional photos, exact GPS, school email). The site is built to accept them cleanly — see Section 8.

---

## 1. PROJECT SUMMARY & SCOPE

A brand-new, custom-built informational website for a British-curriculum early-years and lower-primary school. **5–10 pages.** Core jobs:

1. Present the school warmly and credibly to prospective parents.
2. Let a parent **download an admission form** (PDF) — there is **no online admission form**.
3. Let a parent **enquire** via a short **contact form** that emails the school.
4. Show a simple, **curated Instagram showcase** — a few hand-picked posts, free and manually updated (not an automated feed) — so the site feels active.
5. Give the school's own team a **single, minimal dashboard** to publish **blog/news** posts (and nothing else).

**Explicitly out of scope** (quote separately if requested): online payments, an online admissions portal with logins, a parent/student portal, e-commerce, fee payment, LMS features. If any of these surface mid-build, stop and flag — they change the architecture.

---

## 2. BRAND & DESIGN SYSTEM

### 2.1 Design north star

> **"A three-year-old should smile at it, and their parent should trust it."**

Bright, warm, rounded, playful — but clean, fast, and legible enough that a parent takes the school seriously. Think **friendly primary-colour joy on a calm, uncluttered layout**. Every screen should visibly signal _"this is a school for young children (Daycare through Primary 3)."_ **Positioning line — "We focus on the WHY."** These are the school's own words (from their Instagram) and the single clearest expression of their inquiry-led philosophy — use it as a hero or section line. **Emotional tagline — "The future begins here."** Pupils are affectionately called **"Stars"** — lean into a gentle star motif (the logo carries three stars).

### 2.2 Logo & assets

- Files in `/assets/logo/`. **Do not alter, recolour, redraw, or add effects** — scale only. The masters are transparent PNGs; `kedland-logo.svg` is a scalable wrapper around the exact raster for convenience.
- **Clearspace:** keep padding around the logo equal to the height of one star. Never crowd it.
- **Min size:** 40 px tall on screen (header), 32 px on mobile.
- **On dark navy backgrounds:** the logo is navy, so place it inside a white "sticker" rounded card, or use a white/reversed version `[PENDING — client: reversed logo, or we produce one]`.
- **Favicon:** use `/assets/favicon/favicon.ico` (16/32/48) + link the PNGs + `apple-touch-icon.png` (180). Head snippet in §6.5.
- **Note on true vector:** the source logo is raster (1240 px). We scaled it faithfully rather than trace it (tracing would tamper with the design). If a razor-crisp vector is ever needed for large-format print, commission a redraw as a separate design task.

### 2.3 Colour palette

Sampled from the school logo and admission flyers. Navy is the anchor; the brights are the personality.

| Token         | Hex       | Role                                                                  |
| ------------- | --------- | --------------------------------------------------------------------- |
| `--navy`      | `#0B4A6D` | Primary. Logo, headings, footer, primary text-on-light                |
| `--navy-deep` | `#08334C` | Dark sections, footer background, overlays                            |
| `--yellow`    | `#F7CE46` | Sunshine. Highlights, playful blocks, accents (needs dark text on it) |
| `--red`       | `#E0322C` | Energy. Primary CTAs, alerts, key emphasis                            |
| `--pink`      | `#E5388A` | Playful accent, tags, "Stars" motif, girls'-uniform nod               |
| `--blue`      | `#3D9BE9` | Friendly bright blue, links, secondary accents                        |
| `--sky`       | `#BBD5EF` | Soft backgrounds, cards, section tints (uniform periwinkle)           |
| `--green`     | `#4CB782` | Supplementary playful accent (use sparingly, e.g. EYFS diagram)       |
| `--orange`    | `#F59331` | Supplementary warm accent (diagram / variety)                         |
| `--cream`     | `#FFFBF2` | Warm default page background (softer than pure white)                 |
| `--ink`       | `#12283A` | Body text (deep navy-grey; softer than pure black)                    |
| `--white`     | `#FFFFFF` | Cards, reversed text                                                  |
| `--grey`      | `#6B7A88` | Muted/secondary text, captions                                        |

**Accessibility (enforce):**

- Body text = `--ink` on `--cream`/`--white` (passes AA).
- **Never** put white or yellow text on yellow, or light text on `--sky`. On `--yellow` blocks use `--navy`/`--ink` text.
- CTA buttons: `--red` bg + white text (AA large ✓). Links: `--blue`, underline on hover.
- Maintain ≥ 4.5:1 for body, ≥ 3:1 for large text/icons.

### 2.4 Typography

Rounded, friendly, highly legible. Both are Google Fonts (free, self-host for performance — §6.4).

- **Display / headings:** **Baloo 2** (700/800). Rounded, chunky, playful — the "kids" voice. Use for H1–H3, hero, section titles, buttons.
- **Body / UI:** **Nunito** (400/600/700). Rounded sans, excellent legibility at small sizes. Paragraphs, labels, nav, forms.
- **Fallback stack:** `"Baloo 2", "Fredoka", system-ui, sans-serif` (display) and `"Nunito", system-ui, "Segoe UI", sans-serif` (body).
- **Scale (fluid, `clamp()`):** H1 `clamp(2.2rem,5vw,3.6rem)`, H2 `clamp(1.6rem,3.5vw,2.4rem)`, H3 `1.25rem`, body `1.05rem`, small `0.9rem`. Line-height 1.15 headings / 1.65 body. Generous letter-spacing on eyebrows/labels (`0.06em`, uppercase).

### 2.5 Shape, motion & components (the "kids" language)

- **Roundness everywhere:** border-radius `--r-sm:12px`, `--r-md:20px`, `--r-lg:32px`, `--r-pill:999px`. Cards, images, buttons — all rounded. No sharp corners.
- **Blobs & waves:** separate sections with **wavy SVG dividers** (like the flyers' curved edges), not straight lines. Use organic "blob" shapes behind images and as decorative background spots.
- **Playful spot art:** stars ⭐ (brand), crayon squiggles, dots/confetti, building blocks, ABC/123, balloons, clouds, a rainbow arc. Keep them light and decorative — never clutter the content.
- **Buttons:** pill-shaped, `--red` (primary) / `--navy` (secondary) / `--yellow` (tertiary, dark text). Chunky padding (`14px 28px`), bold Baloo 2, subtle drop shadow, gentle **bounce/scale on hover** (`transform: scale(1.04)`, `transition: .2s`). Big tap targets (≥ 48 px) for parents on phones.
- **Cards:** white on cream, `--r-lg`, soft shadow (`0 10px 30px rgba(11,74,109,.10)`), colourful top border or icon chip. Hover lift.
- **Micro-animations:** gentle float on hero art, fade-up on scroll (respect `prefers-reduced-motion`), soft confetti/sparkle on form success. Keep it delightful, never dizzying.
- **Imagery treatment:** rounded corners, occasional blob masks, thin coloured frame or a playful tilt (`rotate(-2deg)`). Warm, bright, real photos of young children at play/learning.
- **Iconography:** rounded, filled, colourful (e.g. Phosphor "fill" or a rounded set). One accent colour per icon chip.

### 2.6 Imagery direction & safeguarding ⚠️

- **Subject:** babies, toddlers and young children (Daycare through Primary 3) — smiling, playing, painting, reading, building, in Kedland's pink/blue check uniform. This is the emotional core of the site; budget real photography.
- **Now:** the school's flyer photos can seed the hero/gallery `[PLACEHOLDER]`. For gaps, use **bright, diverse, age-appropriate stock** of young African children in a school setting, plus friendly illustration/spot art. Do **not** ship a kids' school site with corporate stock adults.
- **⚠️ Child-image consent (must-do):** any photo of an identifiable real pupil requires **written parental consent** on file before it goes on a public website (Ghana's Data Protection Act; the children are minors; this is the school's legal exposure). The build team must only use pupil images the school confirms are consented. Flag this to the client explicitly — see §8.
- Provide `alt` text on every image; lazy-load below the fold; serve WebP/AVIF with fallbacks; never ship > 250 KB images.

---

## 3. SITE ARCHITECTURE / SITEMAP

```
/  (Home)
/about
   /about/our-story
   /about/mission-vision-values
   /about/principal   (Principal's welcome)
   /about/facilities
/academics
   /academics/early-years   (EYFS + 7 Areas of Study)
   /academics/primary       (Cambridge + subjects)
/admissions
/student-life
/news            (blog/news list)
/news/{slug}     (single post)
/contact
/faqs
```

Count = 8 top pages (About & Academics expand into sub-pages) — within the 5–10 page scope. About sub-pages may be implemented as one long anchored page **or** separate routes; keep nav simple (mega-menu not needed).

**Global header (sticky):** logo (left) · nav (Home · About · Academics · Admissions · Student Life · News · Contact) · a bright pill CTA **"Enrol Now"** (→ /admissions). Mobile: hamburger → full-screen playful menu, large tap targets.

**Global footer (`--navy-deep`):** white logo-sticker + tagline "The future begins here" · quick links · contact block (phones, location, email `[PENDING]`) · social icons (Instagram active; others `[PENDING]`) · small "In God We Trust" line · © Kedland International School + "Website by XCreativs Technologies". Wavy top edge.

**Recurring global components:** (a) **CTA banner** ("Ready to begin your child's journey?" + Enrol/Contact buttons) above footer on most pages; (b) **Instagram showcase** (§5.3) on Home and Contact; (c) wavy section dividers between coloured bands.

---

## 4. PAGE-BY-PAGE CONTENT & LAYOUT

> Copy below is final. `[PENDING — client]` = real data owed. `[PLACEHOLDER]` = temporary. SEO title/description given per page.

### 4.1 HOME `/`

**SEO title:** Kedland International School | British-Curriculum School in Lashibi-Tema
**Meta:** A warm, nurturing British-curriculum school for Daycare through Primary 3 in Community 19, Lashibi-Tema. Where the future begins. Enrol your little Star today.

**§ Hero** (full-width, cream/sky with playful blobs, floating stars)

- Eyebrow: `THE FUTURE BEGINS HERE`
- H1: **Where little Stars learn, play, and shine.**
- Sub: _A warm, British-curriculum school in Lashibi-Tema for Daycare through Primary 3 — nurturing curious minds, kind hearts, and big dreams._
- Buttons: **[Enrol Now]** (red, → /admissions) · **[Book a Tour]** (navy outline, → /contact)
- Visual: bright hero photo of happy young pupils `[PLACEHOLDER — flyer image; replace with shoot]`, rounded/blob-masked, gentle float.
- Trust chips under hero: `British National Curriculum` · `Cambridge Primary` · `Daycare–Primary 3` · `After-School & Weekend Care`.

**§ Welcome strip**

- H2: **Welcome to Kedland**
- Body: _Kedland International School is a vibrant, inclusive community where every child — we call them our Stars — is known, loved, and challenged to grow. We exist to move children from rote learning into inquiry-based learning that sparks curiosity, creativity and an open mind. From your child's very first day, they'll learn in a safe, joyful, child-friendly environment built entirely around them._
- Small **[Read our story →]** (→ /about).

**§ We focus on the WHY** (4 colourful cards, icon chips)

- Eyebrow: `WE FOCUS ON THE WHY` (the school's own line) · H2: **Why little minds thrive at Kedland**

1. **Learning through play & inquiry** — We replace "recite and repeat" with "explore and discover," igniting each child's natural curiosity.
2. **British & Cambridge curriculum** — EYFS in the early years and Cambridge Primary as they grow — a world-class foundation.
3. **Small, caring community** — Every Star is known by name. Kindness, warmth and safety come first.
4. **More than lessons** — Sports, art, music and adventure — plus after-school service and weekend drop-off for busy families.

**§ Our levels** (playful cards / "step" path, star-topped)

- H2: **Room to grow, every step of the way**
- Cards: **Daycare (Babies & Creche) · Nursery 1 · Nursery 2 · Reception · Primary 1–3.** Each: one warm line + tiny illustration. (e.g. _Creche — "Gentle first steps into a world of play and wonder."_)
- **[See admissions →]**

**§ Values band** (`--navy`, reversed text) — the KEDLAND acronym teaser

- H2: **Our name is our promise**
- Show **K·E·D·L·A·N·D** as seven bright letter-tiles; each reveals a value on hover/tap (Kindness, Excellence, Determined, Loveable, Ambitious, Nurturing, Daring). **[Meet our values →]** (→ mission-vision-values).

**§ Principal's welcome teaser** — portrait: use the school logo (`/assets/logo/kedland-logo-512.png`) in a rounded frame for now + short pull-quote (see 4.2c) + **[A message from our Principal →]**.

**§ Instagram showcase** (§5.3) — H2: **Life at Kedland** + a curated grid of a few posts + **[Follow us on Instagram]** (→ @kedlandintlschool).

**§ CTA banner** → footer.

**Home imagery:** lead with joyful children; keep it bright and uncluttered; blob/wave dividers between bands (alternate cream / sky / navy).

---

### 4.2 ABOUT `/about`

**SEO title:** About Us | Kedland International School
**Meta:** Our story, mission, vision and values — a nurturing British-curriculum school in Lashibi-Tema raising creative, open-minded Stars.

Intro band: H1 **About Kedland** · _A community built on kindness, curiosity and care._ Anchor chips to the four sub-sections.

**(a) Our Story** `/about/our-story`

- H2: **How Kedland began**
- Body: _Kedland International School began as a simple summer school — a small idea with a big heart. As families saw their children flourish, that summer programme grew into a full school. Founded by a couple who believed learning should spark curiosity rather than simply fill memories, Kedland was created to bring about a shift: away from rote, recital-based learning and toward inquiry-based learning that ignites research, creativity and an open mind. Today, Kedland is home to a growing family of Stars, learning in ultra-modern, child-friendly surroundings designed for comfort, safety and wonder._
- Pull-stat row `[PLACEHOLDER]`: _Founded as a summer school · British & Cambridge curriculum · Community 19, Lashibi-Tema._

**(b) Mission, Vision & Values** `/about/mission-vision-values`

- **Mission** (card): _To provide exceptional care to children while fostering each child's intellectual, social, physical and moral development in a friendly environment._
- **Vision** (card): _To encourage open minds and creative thinkers who will meet the challenges of the future generation._
- **Motto** (band, star motif): **"In God We Trust."** _Because we are raising creative thinkers to meet the challenges of tomorrow, we do not underestimate the power of God as the ultimate source of guidance, strength and hope — helping our Stars navigate uncertainty with courage._
- **Our Values — they spell our name** (feature block, seven colourful tiles K-E-D-L-A-N-D):
  - **K — Kindness:** We treat others with compassion, empathy and respect.
  - **E — Excellence:** We strive for outstanding performance, from academics to extracurriculars.
  - **D — Determined:** We believe in perseverance and resilience; we urge our Stars to be confident, courageous and to embrace challenges.
  - **L — Loveable:** We cherish warmth, care and affection, and encourage our whole community to show the same.
  - **A — Ambitious:** We go for gold — setting high goals and working hard to reach them.
  - **N — Nurturing:** We value care and support, creating a safe, enabling environment for every child.
  - **D — Daring:** We encourage our Stars to take healthy risks and be adventurous.
  - _Design note:_ this "our values spell KEDLAND" reveal is a signature moment — make it delightful (staggered fade-up, each tile a brand colour, hover to expand).

**(c) Principal's Welcome** `/about/principal`

- H2: **A warm welcome from our Principal**
- Portrait: **use the school logo** (`/assets/logo/kedland-logo-512.png`) as the portrait for now — in a rounded/circular frame with a brand-colour ring. _(Swap for a real photo of Mary when available.)_
- Body (from the school): _"I warmly welcome you to Kedland International School — a vibrant, inclusive community of students we lovingly call Stars. As Principal, I am thrilled to work with our students, parents, teachers and staff to provide a world-class education. Malcolm Forbes said, 'The purpose of education is to replace an empty mind with an open one.' At Kedland, we foster a love for learning, creative thinking and open minds, training students who are ready to solve the challenges of future generations. Our dedicated teachers provide a supportive, challenging environment where every child can reach their full potential. We prize academic excellence, diversity and community, in a safe, child-friendly and respectful place to learn. Explore our website to discover our mission, vision, values and programmes — and do book a tour of our state-of-the-art facilities. Thank you for visiting Kedland. I look forward to exploring the possibilities that lie ahead with you."_
- Sign-off: _Warm regards,_ **Mary — Principal, Kedland International School** · **[Book a Tour]**.

**(d) Facilities** `/about/facilities`

- H2: **A campus built around your child**
- Body: _Kedland is endowed with ultra-modern, state-of-the-art facilities and a child-friendly environment designed for comfort and learning. Our classrooms are spacious, well-ventilated and visually appealing — age-appropriate and calm, with pupil work-stations, art displays and activity centres. Beautiful outdoor spaces give our Stars room to play, explore and grow._
- **Facilities grid** `[PENDING — client: confirm list + photos]` `[PLACEHOLDER]`: Classrooms · Library/Reading corner · ICT suite · Music room (fully furnished with instruments) · Science/discovery area · Outdoor play area · Art & activity centres · Dining/canteen · Safe pickup zone.
- **[Book a Tour]** CTA.

---

### 4.3 ACADEMICS `/academics`

**SEO title:** Academics & Curriculum | Kedland International School
**Meta:** British Early Years Foundation Stage for our youngest Stars and Cambridge Primary as they grow — an inquiry-led, world-class curriculum in Lashibi-Tema.

Intro: H1 **Our Curriculum** · _An international, inquiry-led education — a British foundation in the early years, and Cambridge Primary as your child grows._ Two large route cards → **Early Years** and **Primary**.

**(a) Early Years (EYFS)** `/academics/early-years`

- H2: **Early Years — the British Early Years Foundation Stage (EYFS)**
- Body: _Kedland uses an international curriculum. In the early years, we follow the British National Curriculum — the Early Years Foundation Stage (EYFS). The EYFS sets the statutory standards for the development, learning and care of children from birth to age five, ensuring every child learns and develops well and is kept healthy and safe. It promotes teaching and learning for 'school readiness,' giving children the broad knowledge and skills that form the right foundation for good progress through school and life. It ensures a broad, well-balanced education — setting out the knowledge, skills and understanding expected at each stage of a child's development, while equipping them for future success. Our curriculum also nurtures each child's values, beliefs and attitudes. At the end of the early years, an EYFS profile assessment is completed before the child moves into Key Stage 1._

- **§ The Seven Areas of Study** — **reproduce the honeycomb diagram** `/assets/diagrams/eyfs-areas-of-study.svg` (seven interlocking hexagons; render inline, responsive; on mobile, stack the descriptions below the graphic). Full descriptions (write these out beside/under the diagram):

  1. **Communication and Language** — We give children rich opportunities to speak and listen in a range of situations, developing their confidence and their skill in expressing themselves. Through conversation, songs, stories and play, children learn to understand others and to make themselves understood — the bedrock of all later learning.
  2. **Physical Development** — We provide plenty of opportunities for children to be active and interactive, developing their coordination, control and movement. Both large (running, climbing, balancing) and fine (holding a pencil, threading, cutting) motor skills are nurtured, alongside healthy, active habits.
  3. **Personal, Social and Emotional Development** — We help children develop their social skills, build a good sense of themselves and others, and nurture positive relationships. Children learn to manage feelings, share, take turns, show empathy, and grow in confidence and independence.
  4. **Literacy** — We help children learn to read and write, decode sounds (phonics) and improve their pronunciation. A love of books and stories is cultivated early, giving children the tools and the joy that make reading and writing flourish.
  5. **Understanding the World** — We guide children to make sense of their physical world and their community through opportunities to explore, observe and find out about people, places, technology and the environment — sparking curiosity about how the world works.
  6. **Expressive Arts and Design** — We give children the chance to explore and play with a wide range of media and materials, and to express their ideas and feelings through art, music, movement, dance, role-play and design. They observe the world around them — animals, plants and everyday things — and represent it creatively.
  7. **Mathematics** — We assist children to identify, name and write numbers, do simple addition and subtraction, count reliably, and explore shapes, patterns and measurement — building early number confidence through hands-on, playful activity.

  _Design note:_ colour each hexagon with a brand-bright colour (matching the SVG); big friendly labels inside, full paragraph beside. This section must be readable by both humans and crawlers — keep the descriptions as real HTML text, not baked into the image.

- **§ Assessment:** short card — _An EYFS profile assessment is completed at the end of the early years, before your child begins Key Stage 1 — a rounded picture of each child's progress and readiness._

**(b) Primary (Cambridge)** `/academics/primary`

- H2: **Primary — the Cambridge curriculum**
- Body: _Kedland Primary is currently home to Primary 1–3, with room to grow. Our lessons are educative, interactive, practical and meaningful. To keep learning inclusive and well-rounded, we use a variety of instructional styles and practise differentiated learning — always taking each child's learning needs into account. Our classrooms are visually appealing, age-appropriate and calm, featuring pupil work-stations, art displays and activity centres. Our primary instructors are professional and passionate, planning lessons and activities that spark every child's interest. We use the Cambridge curriculum, which prepares children for life — helping them develop an informed curiosity and a lasting passion for learning._
  - _Note for build:_ the school's written vision references primary up to age 11; **currently the school offers Primary 1–3**. Present "Primary 1–3 (with room to grow)". Do not advertise levels not yet open. `[PENDING — client: confirm exact ages/classes open this year]`
- **§ Primary subjects** (grid of colourful subject cards, each an icon + the blurb below):
  - **English** — Effective communication underpins everything: trust, teamwork, problem-solving and bridging cultures. Cambridge English (reading, writing, speaking and listening) helps our Stars gain real command of the language and analyse texts with confidence.
  - **Mathematics** — "Pure mathematics is the poetry of logical ideas." Maths sharpens logical reasoning and analytical thinking; we help children approach it with confidence and grow strong problem-solving skills.
  - **Science** — Science expands children's understanding of the world and informs real solutions. Our approach drives Stars to discover, question and understand the ideas behind concepts, with the tools they need to explore hands-on.
  - **Information & Communication Technology (ICT)** — Technology drives today's world. Our facilitators guide children through a journey of digital discovery that builds confidence and inventive thinking.
  - **Music** — Music fosters togetherness and improves memory, focus and wellbeing. Kedland has a well-furnished music room with instruments to help our Stars thrive.
  - **Geography** — Children make sense of the world around them — its physical features, people and environments — and how we all interact. Occasional trips inspire curiosity and practical skill.
  - **Arts & Design** — A rich environment for creativity: fine art, graphic design, product design and fashion design. Children are challenged to generate innovative ideas and solutions.
  - **French** — A valuable global skill. Through speaking, writing and comprehension, we build a lasting interest in French so children can communicate effectively.
  - **History** — Children explore human experiences, events and cultures — using sources to understand the past, connect it to the present, and appreciate how far we've come.

---

### 4.4 ADMISSIONS `/admissions`

**SEO title:** Admissions | Enrol at Kedland International School
**Meta:** Admissions are open for Daycare (Babies & Creche), Nursery, Reception and Primary 1–3 in Lashibi-Tema. Download the admission form and begin your child's journey today.

**§ Hero:** H1 **Admissions are open — begin your child's journey** · _We'd love to welcome your little Star to the Kedland family._ Buttons: **[Download Admission Form (PDF)]** (red) · **[Enquire / Book a Tour]** (navy, → /contact).

**§ Levels open now** (star-topped cards): **Daycare (Babies & Creche) · Nursery 1 · Nursery 2 · Reception · Primary 1–3.** Plus a highlighted note: **After-School Service** and **Weekend Drop-Off** available for busy families.

**§ How to enrol — 4 simple steps** (numbered, playful):

1. **Download & complete the form** — grab the admission form (PDF) below and fill it in.
2. **Send it back / bring it in** — return the completed form and your child's documents to the school office `[PENDING — client: return email/address & required documents, e.g. birth certificate, passport photos, immunisation/health record, previous report]`.
3. **Visit us** — book a tour and, where relevant, a friendly familiarisation/assessment for your child `[PENDING — client: confirm whether an assessment/interview applies and for which levels]`.
4. **Welcome to Kedland!** — receive your offer and enrolment details, and get ready for a wonderful first day.

**§ Download block** (big, obvious): **[⬇ Download the Kedland Admission Form (PDF)]** → `/assets/forms/kedland-admission-form.pdf` `[PENDING — client: supply the PDF, or XCreativs to design one]`. Sub-line: _Prefer to talk first? [Contact us] and we'll guide you._

**§ Fees:** Fees are **not published** on the site — parents enquire directly. Copy: _"For current fees and available spaces, please [contact our admissions team] — we're happy to help."_ This makes the contact form the natural next step.

**§ FAQ teaser** → 3 top admissions questions + **[See all FAQs →]**.

**§ CTA banner** → footer.

---

### 4.5 STUDENT LIFE `/student-life`

**SEO title:** Student Life | Kedland International School
**Meta:** Inside life at Kedland — a joyful, safe, inquiry-led day of learning, play, clubs, music, sport and care, for young children (Daycare through Primary 3) in Lashibi-Tema.

**§ Intro:** H1 **Life at Kedland** · _At Kedland, we pride ourselves on a vibrant, inclusive community that fosters academic excellence, creativity and social responsibility. Everything we do is centred on our Stars — thoughtfully designed to give them a well-rounded start and set them up for a bright future._

**§ A day in the life of a Star** (playful timeline / "our day" — expand generously): _`[PLACEHOLDER — confirm real routine with client]`_

- **Warm welcome (morning):** Every child is greeted by name — the day starts with a smile, a song and a calm settle-in.
- **Circle & story time:** We gather to share news, sing, and dive into a story — building language, listening and belonging.
- **Learning through play & inquiry:** Guided, hands-on activities across the day's themes — exploring, questioning and discovering rather than reciting.
- **Snack & outdoor play:** Healthy snacks and plenty of active outdoor time to run, climb and make friends.
- **Creative time:** Art, music, movement or building — because little hands and big imaginations need room to create.
- **Rest & reflect:** Quiet time for our youngest Stars; gentle wind-down and a look back at what we learned.
- **Home time / after-school:** Safe pickup — or stay on for our after-school programme.

**§ Beyond the classroom — clubs & activities:** _Kedland goes beyond the tutoring class. In line with our mission and vision, we encourage every Star to explore a wide range of extracurricular activities — from sport to art and craft — that match their interests. Our Stars are free to explore their creativity, develop new skills and build lasting friendships._ Colourful activity chips `[PLACEHOLDER — confirm offered]`: **Sports & games · Art & craft · Music · Dance · Reading club · Creative play · Field trips.**

**§ Arts, music & sport:** short trio of cards celebrating creativity (art & design), music (our furnished music room & instruments), and active play & sport.

**§ Care for busy families — After-School & Weekend:** _We know families are busy. Kedland offers an **After-School Service** and **Weekend Drop-Off**, giving your child a safe, engaging and caring place to be — with people they know and trust._ `[PENDING — client: hours & details]`.

**§ Campus & community:** _Our campus is designed to enrich student life — a safe, comfortable and conducive environment supporting each child's academic, social and emotional growth: state-of-the-art facilities, spacious, well-ventilated classrooms and beautiful outdoor spaces. Our community values diversity, equity and inclusion — we celebrate our differences, support one another, and build a positive place to learn and grow together._

**§ Pastoral care & wellbeing:** _Every Star is known and cared for. We put warmth, kindness and emotional security first, so children feel safe, confident and ready to learn._

**§ Safeguarding — your child's safety comes first** (generated; reassuring and standard): _The safety and wellbeing of every child is our highest priority. Kedland maintains a safe, secure and child-friendly environment, with controlled access to our campus, caring supervision throughout the day, and a safe, orderly pickup process. Our staff are committed to the care, protection and dignity of every child._ `[PENDING — client: confirm/approve safeguarding wording & any policy to link]`.

**§ Our staff & community** (from the school): _We believe our staff are our greatest asset. We foster a positive, supportive environment built on collaboration, innovation and professional growth, and we invest in ongoing professional development — regular training, workshops and conferences — so our team stays current with the best in teaching and learning._

**§ CTA:** **[Book a Tour]** / **[Enrol Now]**.

---

### 4.6 NEWS / BLOG `/news` and `/news/{slug}`

**SEO title:** News & Blog | Kedland International School
**Meta:** The latest news, events and stories from Kedland International School in Lashibi-Tema.

- **List page:** H1 **News & Stars in Action** · responsive grid of post cards (featured image, title, date, 1-line excerpt, category tag), newest first, rounded cards, playful hover lift. Pagination or "load more". Optional category filter (News · Events · Learning). Empty state (before first post): a friendly "New stories coming soon — follow us on Instagram!" card.
- **Single post:** hero image + title + date `[+ author optional]`; clean, readable article body supporting **headings, paragraphs, bold/italic, lists, links, and inline images**; "back to news"; **social share buttons — WhatsApp, Facebook, X/Twitter, LinkedIn and copy-link** (so posts can be shared to the various socials and WhatsApp); "related posts". Generous line-length and spacing for readability.
- **Content source:** posts are created/edited/deleted **only** via the dashboard in §5.4. Everything on these two pages is dynamic from that store.
- **SEO per post:** title = post title; meta = excerpt; add Open Graph image (featured image) so shared links look good.

---

### 4.7 CONTACT `/contact`

**SEO title:** Contact Us | Kedland International School, Lashibi-Tema
**Meta:** Get in touch with Kedland International School in Community 19, Lashibi-Tema. Enquire about admissions, book a tour, or ask us anything.

**§ Intro:** H1 **Get in touch** · _We'd love to hear from you. Ask a question, enquire about admissions, or book a tour — we're happy to help._

**§ Two-column layout:** left = **contact details & map**; right = **contact form** (§5.1).

**Contact details** (from flyers — use these now):

- **Location:** Community 19 Annex, Lashibi-Tema — near Deon Recreational Centre, Greater Accra, Ghana. `[PENDING — client: exact street + Ghana Post GPS code]`
- **Phone / WhatsApp:** +233 257 130 333 · +233 202 472 472 · +233 244 958 103
- **Email:** `[PENDING — client: official school email once Workspace is set up]` `[PLACEHOLDER: info@kedland.edu.gh]`
- **Office hours:** `[PENDING — client]` `[PLACEHOLDER: Mon–Fri, 7:30am–4:00pm]`
- **Socials:** Instagram — [@kedlandintlschool](https://www.instagram.com/kedlandintlschool) · others `[PENDING]`.

**Map:** embed Google Maps for Community 19 Annex, near Deon Recreational Centre `[PLACEHOLDER — centre on the area; replace with exact pin once GPS supplied]`. Rounded corners, brand frame.

**§ Instagram showcase** (§5.3) beneath.

**§ Note:** the contact form is the school's enquiry funnel — there is **no separate online admission form**; the admission form is a **download** on /admissions.

---

### 4.8 FAQs `/faqs`

**SEO title:** Frequently Asked Questions | Kedland International School
**Meta:** Answers to common questions about admissions, curriculum, ages, fees, after-school care and more at Kedland International School, Lashibi-Tema.

Accordion, grouped. Copy below (verify `[PENDING]` answers with client before launch):

**Admissions**

- **How do I enrol my child?** Download our admission form (PDF) from the Admissions page, complete it, and return it to the school with your child's documents. Prefer to talk first? Just contact us and we'll guide you.
- **Which ages and levels do you accept?** We welcome children from Daycare (Babies & Creche) through Nursery 1 & 2, Reception, and Primary 1–3. `[PENDING — confirm exact age bands]`
- **When can my child start?** `[PENDING — rolling vs termly intake; term start dates]`
- **Is there an assessment or interview?** `[PENDING — confirm; if yes, which levels and what it involves]`
- **What documents do I need?** `[PENDING — e.g. birth certificate, passport photos, immunisation record, previous report]`
- **How much are the fees?** For current fees and available spaces, please contact our admissions team — we're happy to help (call/WhatsApp us or use the form on the Contact page).

**Curriculum & learning**

- **What curriculum do you follow?** In the early years we follow the British EYFS (Early Years Foundation Stage); in primary we use the Cambridge curriculum.
- **What makes Kedland different?** We move children from rote, recital-based learning to inquiry-based learning — sparking curiosity, creativity and an open mind, in a warm, child-friendly environment.
- **What subjects are taught in primary?** English, Mathematics, Science, ICT, Music, Geography, Arts & Design, French and History.
- **How is my child's progress assessed in early years?** An EYFS profile assessment is completed before your child moves into Key Stage 1.

**School life**

- **What are your school hours?** `[PENDING]` `[PLACEHOLDER: Mon–Fri, 7:30am–4:00pm]`
- **Do you offer after-school or weekend care?** Yes — we offer an After-School Service and Weekend Drop-Off for busy families. `[PENDING — hours/details]`
- **Is there a school uniform?** `[PENDING — confirm; the flyers show a pink/blue check uniform]`
- **What extracurricular activities are available?** Sports, art & craft, music and more — plus occasional field trips. `[PENDING — confirm full list]`
- **How do you keep children safe?** Safety is our highest priority: a secure, child-friendly campus with controlled access, caring supervision and a safe pickup process.

**Practical**

- **Where are you located?** Community 19 Annex, Lashibi-Tema, near Deon Recreational Centre, Greater Accra.
- **How do I contact the school?** Call/WhatsApp +233 257 130 333, +233 202 472 472 or +233 244 958 103, or use the form on our Contact page.
- **Can I visit before enrolling?** Absolutely — we'd love to show you around. Book a tour via the Contact page.

Add **JSON-LD `FAQPage`** structured data for these (SEO). CTA at the bottom: **[Still have a question? Contact us]**.

---

## 5. FEATURES & COMPONENTS (TECHNICAL)

### 5.1 Contact form (Contact page)

**Purpose:** parent enquiry → email to the school. Replaces any online admission form.

**Fields**

| Field                           | Type           | Required | Notes                                                                                |
| ------------------------------- | -------------- | -------- | ------------------------------------------------------------------------------------ |
| Full name                       | text           | ✓        |                                                                                      |
| Email                           | email          | ✓        | validate format                                                                      |
| Phone / WhatsApp                | tel            | ✓        | Ghana format hint (+233…)                                                            |
| I'm enquiring about             | select         | ✓        | Admissions · Book a tour · After-school/weekend care · General enquiry               |
| Child's age / level of interest | select or text | –        | Daycare (Babies/Creche) · Nursery 1 · Nursery 2 · Reception · Primary 1–3 · Not sure |
| Message                         | textarea       | ✓        |                                                                                      |
| Consent checkbox                | checkbox       | ✓        | "I agree to be contacted by Kedland about my enquiry."                               |
| Honeypot                        | hidden         | –        | spam trap (see below)                                                                |

**Behaviour & UX**

- Inline validation, friendly error text, big rounded inputs, large submit button ("Send my enquiry").
- **Success:** playful confetti/sparkle + message: _"Thank you! Your message has reached the Kedland team. We'll be in touch very soon. 🌟"_ Clear the form. **Failure:** friendly error + the school's phone numbers as fallback.
- Accessible: labels tied to inputs, `aria-live` for status, keyboard-friendly.

**Delivery** (see §6.3): submit → serverless function → **Resend** (free tier) → the school's **Google Workspace** inbox `[PENDING — client: destination address]`.

- **Email to school:** subject `New enquiry from {name} — {enquiring about}`; body = all fields, tidy; `reply-to` = parent's email (so staff can reply directly).
- **Auto-reply to parent** (nice-to-have, recommended): branded "we've received your enquiry" confirmation.
- **Spam protection:** honeypot field + **Cloudflare Turnstile** (free, privacy-friendly) — invisible/low-friction. No reCAPTCHA needed.
- **Never** expose the Resend API key client-side — it lives as a server secret in the function.

### 5.2 Admission form download (Admissions page)

- A static **PDF** served from `/assets/forms/kedland-admission-form.pdf`, behind a prominent download button. No processing.
- `[PENDING — client: supply the admission form PDF]`. If they don't have a clean one, **XCreativs can design a branded fillable PDF** — flag as a small add-on.
- Track downloads via an analytics event (optional).

### 5.3 Instagram showcase (Home + Contact)

**What the client wants:** a very simple, **free, manually-curated** showcase of a few Instagram posts — _not_ an automated always-live feed, and **no paid service, no API, no tokens, no ongoing cost.** We just display a handful of posts and link out to the profile.

**Handle:** [@kedlandintlschool](https://www.instagram.com/kedlandintlschool)

**How to build it — free, manual, simple:**

- **Recommended — curated static grid.** Place 4–6 of the school's own post images in a rounded grid (reuse the site's playful card style). Each tile links to the Instagram profile (or the specific post), plus a **[Follow us on Instagram]** button → @kedlandintlschool. The images live in the repo like any other asset; "updating" the showcase just means swapping a few images now and then (a quick manual task — can sit in the care plan). These are the school's **own** posts, so there's no rights issue; keep the files small and optimised.
- **Alternative — Instagram's native post embed (also free, no account/API).** If they'd rather show the "real post" look, hand-pick specific posts and paste Instagram's free embed code (blockquote + embed.js). It only changes when someone edits the embeds — still manual. It's heavier and depends on Instagram's script, so the static grid is the lighter, more reliable default.

**Do NOT** use a paid widget, the Graph API, access tokens, or any auto-sync — explicitly out of scope. **No Business/Creator account is required** for either approach.

**Behaviour:** lazy-load the images/embeds so they never block render; the section is decorative + a link out. Keep it light.

### 5.4 Blog / News dashboard (the ONLY admin tool)

**Single, deliberate purpose:** let the school's team **create, edit, and delete** blog/news posts. **Nothing else.** No page editing, no settings, no user management beyond login — all other site changes are done by XCreativs. Keep it genuinely minimal; **do not over-engineer.**

**Post editor requirements (a "basic Google-Docs-like" experience):**

- Title, publish date, category (News / Events / Learning), featured image, short excerpt.
- **Rich-text body** supporting: headings, bold/italic, bullet & numbered lists, **links**, and **inline images** (upload + insert). Optional: quote block. That's the ceiling — keep it simple.
- **Image upload** with automatic resize/optimisation; sensible size limits.
- Actions: **Save draft · Publish · Edit · Delete**. A simple list of existing posts with edit/delete.
- **Auth:** simple, secure login for 2–3 authorised staff only (controlled access — this is exactly what failed before). Enforce strong passwords; log activity.

**Recommended implementation (lowest cost & upkeep, fits the static architecture):**

- **Git-based headless CMS — e.g. Decap CMS (formerly Netlify CMS), Sveltia CMS, or Pages CMS.** Posts are stored as Markdown + images **in the repo**; the CMS gives a clean editor UI with exactly the create/edit/delete + rich-text + image operations above. **No database, no server to maintain, near-zero cost**, and it deploys naturally with Cloudflare Pages/Netlify. This is the sweet spot for "basic, one job, no over-engineering."
- **Alternatives if the team prefers a classic backend:** a tiny custom admin (e.g. Next.js/Node) with a lightweight DB (SQLite/Postgres) + object storage (Cloudflare R2/S3) for images. More moving parts and cost; only choose if there's a reason not to use the Git-based CMS.
- Either way, the **public /news pages read from the same store**; publishing triggers a rebuild/refresh.

_Dev decision point:_ pick **Git-based CMS** unless the client has a specific need for a live database. Document the choice in the repo README.

---

## 6. TECHNICAL SPEC & DELIVERY

### 6.1 Recommended stack

- **Static / headless site** — e.g. **Astro** or **Next.js (static export)** or 11ty. Astro is ideal here (content-driven, ships minimal JS, great performance, easy islands for the form/Instagram). Component styling via CSS/Tailwind using the tokens in §2.3–2.5.
- **Content:** Markdown/MDX for pages + Git-based CMS for blog (§5.4).
- **Rationale:** the old site failed from uncontrolled edits on a heavy CMS. Static + role-scoped, Git-tracked content removes that entire failure class and makes the care plan near-pure margin.

### 6.2 Hosting & DNS

- **Host:** **Cloudflare Pages** (static assets free & unlimited; Pages Functions for the form on the generous free tier; free SSL; global CDN; no cold-start). Netlify is an equivalent alternative.
- **Domain:** **kedland.edu.gh** — registration being completed **25 July 2026** (school supplying the required .edu.gh accreditation docs). Once live: configure DNS at the host; force HTTPS; www→apex redirect.

### 6.3 Email & forms

- **Sending:** **Resend** (free tier) via a serverless function for the contact form (and auto-reply).
- **Receiving:** the school's **Google Workspace** mailbox `[PENDING — address]`.
- **DNS records (critical — get right or mail lands in spam):**
  - **SPF:** one TXT record combining Google Workspace **and** Resend includes (do not create two SPF records).
  - **DKIM:** enable for Google Workspace **and** for Resend (separate keys/records).
  - **DMARC:** add a sensible policy record.
- Store the Resend API key as a **server-side secret** (never in client code/repo).

### 6.4 Performance

- Self-host fonts (Baloo 2, Nunito) with `font-display: swap`; subset to Latin.
- Images: WebP/AVIF + responsive `srcset`, lazy-load below fold, explicit width/height (no layout shift).
- Minify/bundle; defer non-critical JS; the Instagram showcase must never block render.
- Targets: Lighthouse ≥ 90 across the board; LCP < 2.5s on 3G-ish; CLS < 0.1. Important for parents on mobile data in Ghana.

### 6.5 SEO, analytics, structured data

- Per-page `<title>` + meta description (given in §4). Open Graph + Twitter cards (default OG image = logo on brand background or a hero).
- **JSON-LD:** `School`/`EducationalOrganization` (name, logo, address, phones, geo, sameAs=Instagram) on Home/Contact; `FAQPage` on /faqs; `Article` on blog posts.
- `sitemap.xml` + `robots.txt`. Google Search Console + a privacy-friendly analytics (Cloudflare Web Analytics or Plausible) `[PENDING — client preference]`.
- Favicon head block:
  ```html
  <link rel="icon" href="/assets/favicon/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon.png" />
  <meta name="theme-color" content="#0B4A6D" />
  ```

### 6.6 Security, accessibility, compliance

- HTTPS only; security headers (CSP allowing the chosen Instagram/CMS/analytics origins, HSTS, X-Content-Type-Options, Referrer-Policy).
- CMS: strong auth, controlled access (2–3 users), activity logging.
- **Accessibility:** WCAG 2.1 AA — semantic HTML, labelled forms, alt text, focus states, colour-contrast per §2.3, `prefers-reduced-motion` honoured.
- **Data protection:** contact-form consent checkbox + a short **Privacy Notice** page `[PENDING — client: approve]`; only display consented pupil images (§2.6).

### 6.7 Environments & handover

- **Git repo** (single source), preview deploys on PRs, production on main.
- Handover: repo access, all logins/credentials, a short **admin guide** for the blog dashboard, and documentation. 30 days post-launch support included (per the engagement); care plan from day 31.
- Provide a `README.md` in the repo capturing stack choices, the CMS decision, and how to run/deploy.

---

## 7. DIAGRAMS & ASSET INDEX

- **EYFS Seven Areas of Study** — `/assets/diagrams/eyfs-areas-of-study.svg` (honeycomb; recreated on-brand from the school's source diagram). Render inline on /academics/early-years; keep the seven descriptions as real HTML text beside it (§4.3a).
- **Logo** — `/assets/logo/` (master 1791px + 1024/512/256/192/128/96/64 PNG + `kedland-logo.svg`). Scale only; never redraw or recolour.
- **Favicons** — `/assets/favicon/` (`favicon.ico`, 16/32/48/64/180/192/512 PNG, `apple-touch-icon.png`).
- **Admission form PDF** — not shipped in this package; create `/assets/forms/kedland-admission-form.pdf` when supplied `[PENDING — client or XCreativs to produce]`.

---

## 8. CONTENT & DECISIONS STILL REQUIRED FROM THE SCHOOL (PUNCH LIST)

Send this list to the client and track it — the 14-day content window runs against it.

**People & photos**

- [x] **Principal** — name (Mary), title and sign-off confirmed; logo used as portrait. _Optional:_ a real photo of Mary to replace the logo placeholder.
- [ ] **Staff/leadership** to feature: names, roles, photos, short bios (or confirm "none for now").
- [ ] **Professional photography** of pupils, classrooms, facilities & activities (recommend a half-day shoot).
- [ ] **Written parental consent** confirmed for any real pupil photos used publicly. ⚠️

**Facts & policies**

- [ ] **Exact levels/ages** open this academic year (confirm Primary 1–3; ages per level).
- [ ] **Admissions details:** required documents, return method (email/address), intake (rolling/termly), term dates, whether an assessment/interview applies.
- [x] **Fees** — decided: not published; parents contact the school.
- [ ] **School hours**, **after-school & weekend** details, **uniform** confirmation, **full extracurricular** list.
- [ ] **Facilities** final list (+ photos).
- [ ] **Safeguarding** wording approval (+ any policy PDF to link).

**Contact & digital**

- [ ] Official **school email** (once Workspace is live) — destination for the contact form.
- [ ] Exact **street address + Ghana Post GPS** code and the precise map pin.
- [x] **Instagram** — handle confirmed: @kedlandintlschool (simple manual showcase; no Business account or API needed). Other social links `[PENDING]`.
- [ ] **Admission form PDF** (supply, or approve XCreativs to design one).
- [ ] Approve **Privacy Notice** copy.
- [ ] Confirm **reversed/white logo** need (or approve XCreativs to produce one).

**Provided already (no action):** About, Mission, Vision, Motto, Values (KEDLAND), Principal's message, Student Life notes, curriculum (EYFS + Cambridge subjects), level list & services, public phone numbers, location area, logo. All incorporated above.

---

_Prepared by XCreativs Technologies — Intelligent Digital Systems Company. Confidential; for the Kedland International School engagement and its build team._
