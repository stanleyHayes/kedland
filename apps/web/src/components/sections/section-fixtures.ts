import { validateSectionData, type PageKey } from "@kedland/types";

/**
 * One real example of every section type the registry can serve.
 *
 * Taken from the school's seeded copy rather than invented, so these are the
 * exact shapes the CMS actually hands the site. `assertFixturesValid` re-checks
 * each one against its registry schema, so a fixture that drifts from the
 * schema fails loudly rather than quietly testing a shape that no longer
 * exists.
 *
 * Regenerate by reading `/content?page=…` for every page key and taking the
 * first occurrence of each section type.
 */

export interface SectionFixture {
  page: PageKey;
  key: string;
  type: string;
  data: Record<string, unknown>;
}

const FIXTURES: Record<string, { page: PageKey; key: string; data: Record<string, unknown> }> = {
  hero: {
    page: "home",
    key: "hero",
    data: {
      eyebrow: "THE FUTURE BEGINS HERE",
      heading: "Where little Stars learn, play, and shine.",
      subheading:
        "A warm, British-curriculum school in Lashibi-Tema for Daycare through Primary 3 — nurturing curious minds, kind hearts, and big dreams.",
      primaryCta: {
        label: "Enrol Now",
        href: "/admissions",
      },
      secondaryCta: {
        label: "Book a Tour",
        href: "/contact",
      },
      image: {
        mediaId: "placeholder-hero",
        alt: "Happy young pupils at Kedland International School",
      },
      trustChips: [
        "British National Curriculum",
        "Cambridge Primary",
        "Daycare–Primary 3",
        "After-School & Weekend Care",
      ],
    },
  },
  "prose-strip": {
    page: "home",
    key: "welcome",
    data: {
      heading: "Welcome to Kedland",
      body: "Kedland International School is a vibrant, inclusive community where every child — we call them our Stars — is known, loved, and challenged to grow. We exist to move children from rote learning into inquiry-based learning that sparks curiosity, creativity and an open mind. From your child's very first day, they'll learn in a safe, joyful, child-friendly environment built entirely around them.",
      link: {
        label: "Read our story",
        href: "/about/our-story",
      },
    },
  },
  "icon-cards": {
    page: "home",
    key: "why-cards",
    data: {
      eyebrow: "WE FOCUS ON THE WHY",
      heading: "Why little minds thrive at Kedland",
      cards: [
        {
          icon: "sparkle",
          title: "Learning through play & inquiry",
          body: 'We replace "recite and repeat" with "explore and discover," igniting each child\'s natural curiosity.',
        },
        {
          icon: "book",
          title: "British & Cambridge curriculum",
          body: "EYFS in the early years and Cambridge Primary as they grow — a world-class foundation.",
        },
        {
          icon: "heart",
          title: "Small, caring community",
          body: "Every Star is known by name. Kindness, warmth and safety come first.",
        },
        {
          icon: "palette",
          title: "More than lessons",
          body: "Sports, art, music and adventure — plus after-school service and weekend drop-off for busy families.",
        },
      ],
    },
  },
  "level-cards": {
    page: "home",
    key: "levels",
    data: {
      heading: "Room to grow, every step of the way",
      levels: [
        {
          icon: "baby",
          name: "Daycare (Babies & Creche)",
          blurb: "Gentle first steps into a world of play and wonder.",
        },
        {
          icon: "blocks",
          name: "Nursery 1",
          blurb: "Curious hands, first friendships and plenty of songs.",
        },
        {
          icon: "palette",
          name: "Nursery 2",
          blurb: "Discovering letters, numbers and how things work.",
        },
        {
          icon: "star",
          name: "Reception",
          blurb: "Getting ready for school, one confident step at a time.",
        },
        {
          icon: "book",
          name: "Primary 1–3",
          blurb: "Cambridge Primary — inquiry, ideas and a love of learning.",
        },
      ],
      cta: {
        label: "See admissions",
        href: "/admissions",
      },
    },
  },
  "values-tiles": {
    page: "home",
    key: "values",
    data: {
      heading: "Our name is our promise",
      tiles: [
        {
          letter: "K",
          name: "Kindness",
          body: "We treat others with compassion, empathy and respect.",
        },
        {
          letter: "E",
          name: "Excellence",
          body: "We strive for outstanding performance, from academics to extracurriculars.",
        },
        {
          letter: "D",
          name: "Determined",
          body: "We believe in perseverance and resilience; we urge our Stars to be confident, courageous and to embrace challenges.",
        },
        {
          letter: "L",
          name: "Loveable",
          body: "We cherish warmth, care and affection, and encourage our whole community to show the same.",
        },
        {
          letter: "A",
          name: "Ambitious",
          body: "We go for gold — setting high goals and working hard to reach them.",
        },
        {
          letter: "N",
          name: "Nurturing",
          body: "We value care and support, creating a safe, enabling environment for every child.",
        },
        {
          letter: "D",
          name: "Daring",
          body: "We encourage our Stars to take healthy risks and be adventurous.",
        },
      ],
      cta: {
        label: "Meet our values",
        href: "/about/mission-vision-values",
      },
    },
  },
  "quote-teaser": {
    page: "home",
    key: "principal",
    data: {
      portrait: {
        mediaId: "principal-mary",
        alt: "Mary, Principal of Kedland International School",
      },
      quote:
        "At Kedland, we foster a love for learning, creative thinking and open minds, training students who are ready to solve the challenges of future generations.",
      name: "Mary",
      role: "Principal, Kedland International School",
      cta: {
        label: "A message from our Principal",
        href: "/about/principal",
      },
    },
  },
  instagram: {
    page: "home",
    key: "instagram",
    data: {
      heading: "Life at Kedland",
      handle: "@kedlandintlschool",
    },
  },
  "cta-banner": {
    page: "home",
    key: "cta-banner",
    data: {
      heading: "Ready to begin your child's journey?",
      body: "We would love to welcome your little Star to the Kedland family. Come and see us, or send us a message — we are happy to help.",
      primaryCta: {
        label: "Enrol Now",
        href: "/admissions",
      },
      secondaryCta: {
        label: "Book a Tour",
        href: "/contact",
      },
    },
  },
  "page-intro": {
    page: "about",
    key: "intro",
    data: {
      eyebrow: "ABOUT KEDLAND",
      heading: "About Kedland",
      standfirst: "A community built on kindness, curiosity and care.",
    },
  },
  "prose-band": {
    page: "about/our-story",
    key: "story",
    data: {
      heading: "How Kedland began",
      body: "Kedland International School began as a simple summer school — a small idea with a big heart. As families saw their children flourish, that summer programme grew into a full school. Founded by a couple who believed learning should spark curiosity rather than simply fill memories, Kedland was created to bring about a shift: away from rote, recital-based learning and toward inquiry-based learning that ignites research, creativity and an open mind. Today, Kedland is home to a growing family of Stars, learning in ultra-modern, child-friendly surroundings designed for comfort, safety and wonder.",
    },
  },
  "mission-vision": {
    page: "about/mission-vision-values",
    key: "mission-vision",
    data: {
      missionHeading: "Mission",
      mission:
        "To provide exceptional care to children while fostering each child's intellectual, social, physical and moral development in a friendly environment.",
      visionHeading: "Vision",
      vision:
        "To encourage open minds and creative thinkers who will meet the challenges of the future generation.",
      mottoHeading: "Motto",
      motto: "In God We Trust.",
      mottoBody:
        "Because we are raising creative thinkers to meet the challenges of tomorrow, we do not underestimate the power of God as the ultimate source of guidance, strength and hope — helping our Stars navigate uncertainty with courage.",
    },
  },
  letter: {
    page: "about/principal",
    key: "letter",
    data: {
      heading: "A warm welcome from our Principal",
      portrait: {
        mediaId: "principal-mary",
        alt: "Mary, Principal of Kedland International School",
      },
      body: "I warmly welcome you to Kedland International School — a vibrant, inclusive community of students we lovingly call Stars. As Principal, I am thrilled to work with our students, parents, teachers and staff to provide a world-class education. Malcolm Forbes said, 'The purpose of education is to replace an empty mind with an open one.' At Kedland, we foster a love for learning, creative thinking and open minds, training students who are ready to solve the challenges of future generations. Our dedicated teachers provide a supportive, challenging environment where every child can reach their full potential. We prize academic excellence, diversity and community, in a safe, child-friendly and respectful place to learn. Explore our website to discover our mission, vision, values and programmes — and do book a tour of our state-of-the-art facilities. Thank you for visiting Kedland. I look forward to exploring the possibilities that lie ahead with you.",
      signOff: "Warm regards,",
      name: "Mary",
      role: "Principal, Kedland International School",
      cta: {
        label: "Book a Tour",
        href: "/contact",
      },
    },
  },
  "feature-grid": {
    page: "about/facilities",
    key: "facilities",
    data: {
      heading: "A campus built around your child",
      intro:
        "Kedland is endowed with ultra-modern, state-of-the-art facilities and a child-friendly environment designed for comfort and learning. Our classrooms are spacious, well-ventilated and visually appealing — age-appropriate and calm, with pupil work-stations, art displays and activity centres. Beautiful outdoor spaces give our Stars room to play, explore and grow.",
      items: [
        {
          icon: "book",
          label: "Classrooms",
        },
        {
          icon: "book",
          label: "Library & reading corner",
        },
        {
          icon: "monitor",
          label: "ICT suite",
        },
        {
          icon: "music",
          label: "Music room",
        },
        {
          icon: "sparkle",
          label: "Science & discovery area",
        },
        {
          icon: "sun",
          label: "Outdoor play area",
        },
        {
          icon: "palette",
          label: "Art & activity centres",
        },
        {
          icon: "utensils",
          label: "Dining & canteen",
        },
        {
          icon: "shield",
          label: "Safe pickup zone",
        },
      ],
    },
  },
  trio: {
    page: "academics",
    key: "routes",
    data: {
      heading: "Two stages, one philosophy",
      cards: [
        {
          icon: "baby",
          title: "Early Years",
          body: "The British Early Years Foundation Stage, with its seven areas of study, for our youngest Stars.",
        },
        {
          icon: "book",
          title: "Primary",
          body: "Cambridge Primary for Primary 1–3 — educative, interactive, practical and meaningful.",
        },
        {
          icon: "sparkle",
          title: "Inquiry throughout",
          body: "At every stage we move children from reciting toward researching, questioning and discovering.",
        },
      ],
    },
  },
  "eyfs-areas": {
    page: "academics/early-years",
    key: "eyfs",
    data: {
      heading: "Early Years — the British Early Years Foundation Stage (EYFS)",
      intro:
        "Kedland uses an international curriculum. In the early years, we follow the British National Curriculum — the Early Years Foundation Stage (EYFS). The EYFS sets the statutory standards for the development, learning and care of children from birth to age five, ensuring every child learns and develops well and is kept healthy and safe. It promotes teaching and learning for 'school readiness,' giving children the broad knowledge and skills that form the right foundation for good progress through school and life. It ensures a broad, well-balanced education — setting out the knowledge, skills and understanding expected at each stage of a child's development, while equipping them for future success. Our curriculum also nurtures each child's values, beliefs and attitudes. At the end of the early years, an EYFS profile assessment is completed before the child moves into Key Stage 1.",
      areas: [
        {
          number: 1,
          title: "Communication and Language",
          body: "We give children rich opportunities to speak and listen in a range of situations, developing their confidence and their skill in expressing themselves. Through conversation, songs, stories and play, children learn to understand others and to make themselves understood — the bedrock of all later learning.",
        },
        {
          number: 2,
          title: "Physical Development",
          body: "We provide plenty of opportunities for children to be active and interactive, developing their coordination, control and movement. Both large (running, climbing, balancing) and fine (holding a pencil, threading, cutting) motor skills are nurtured, alongside healthy, active habits.",
        },
        {
          number: 3,
          title: "Personal, Social and Emotional Development",
          body: "We help children develop their social skills, build a good sense of themselves and others, and nurture positive relationships. Children learn to manage feelings, share, take turns, show empathy, and grow in confidence and independence.",
        },
        {
          number: 4,
          title: "Literacy",
          body: "We help children learn to read and write, decode sounds (phonics) and improve their pronunciation. A love of books and stories is cultivated early, giving children the tools and the joy that make reading and writing flourish.",
        },
        {
          number: 5,
          title: "Understanding the World",
          body: "We guide children to make sense of their physical world and their community through opportunities to explore, observe and find out about people, places, technology and the environment — sparking curiosity about how the world works.",
        },
        {
          number: 6,
          title: "Expressive Arts and Design",
          body: "We give children the chance to explore and play with a wide range of media and materials, and to express their ideas and feelings through art, music, movement, dance, role-play and design. They observe the world around them — animals, plants and everyday things — and represent it creatively.",
        },
        {
          number: 7,
          title: "Mathematics",
          body: "We assist children to identify, name and write numbers, do simple addition and subtraction, count reliably, and explore shapes, patterns and measurement — building early number confidence through hands-on, playful activity.",
        },
      ],
      assessmentHeading: "Assessment",
      assessment:
        "An EYFS profile assessment is completed at the end of the early years, before your child begins Key Stage 1 — a rounded picture of each child's progress and readiness.",
    },
  },
  "subjects-grid": {
    page: "academics/primary",
    key: "subjects",
    data: {
      heading: "Primary — the Cambridge curriculum",
      intro:
        "Kedland Primary is currently home to Primary 1–3, with room to grow. Our lessons are educative, interactive, practical and meaningful. To keep learning inclusive and well-rounded, we use a variety of instructional styles and practise differentiated learning — always taking each child's learning needs into account. Our classrooms are visually appealing, age-appropriate and calm, featuring pupil work-stations, art displays and activity centres. Our primary instructors are professional and passionate, planning lessons and activities that spark every child's interest. We use the Cambridge curriculum, which prepares children for life — helping them develop an informed curiosity and a lasting passion for learning.",
      subjects: [
        {
          icon: "book",
          title: "English",
          body: "Effective communication underpins everything: trust, teamwork, problem-solving and bridging cultures. Cambridge English (reading, writing, speaking and listening) helps our Stars gain real command of the language and analyse texts with confidence.",
        },
        {
          icon: "calculator",
          title: "Mathematics",
          body: '"Pure mathematics is the poetry of logical ideas." Maths sharpens logical reasoning and analytical thinking; we help children approach it with confidence and grow strong problem-solving skills.',
        },
        {
          icon: "sparkle",
          title: "Science",
          body: "Science expands children's understanding of the world and informs real solutions. Our approach drives Stars to discover, question and understand the ideas behind concepts, with the tools they need to explore hands-on.",
        },
        {
          icon: "monitor",
          title: "Information & Communication Technology",
          body: "Technology drives today's world. Our facilitators guide children through a journey of digital discovery that builds confidence and inventive thinking.",
        },
        {
          icon: "music",
          title: "Music",
          body: "Music fosters togetherness and improves memory, focus and wellbeing. Kedland has a well-furnished music room with instruments to help our Stars thrive.",
        },
        {
          icon: "globe",
          title: "Geography",
          body: "Children make sense of the world around them — its physical features, people and environments — and how we all interact. Occasional trips inspire curiosity and practical skill.",
        },
        {
          icon: "palette",
          title: "Arts & Design",
          body: "A rich environment for creativity: fine art, graphic design, product design and fashion design. Children are challenged to generate innovative ideas and solutions.",
        },
        {
          icon: "globe",
          title: "French",
          body: "A valuable global skill. Through speaking, writing and comprehension, we build a lasting interest in French so children can communicate effectively.",
        },
        {
          icon: "book",
          title: "History",
          body: "Children explore human experiences, events and cultures — using sources to understand the past, connect it to the present, and appreciate how far we've come.",
        },
      ],
    },
  },
  steps: {
    page: "admissions",
    key: "steps",
    data: {
      heading: "How to enrol — 4 simple steps",
      steps: [
        {
          title: "Download & complete the form",
          body: "Grab the admission form (PDF) below and fill it in.",
        },
        {
          title: "Send it back or bring it in",
          body: "Return the completed form and your child's documents to the school office. Contact us and we will confirm exactly what to bring.",
        },
        {
          title: "Visit us",
          body: "Book a tour and, where relevant, a friendly familiarisation session for your child.",
        },
        {
          title: "Welcome to Kedland!",
          body: "Receive your offer and enrolment details, and get ready for a wonderful first day.",
        },
      ],
    },
  },
  "download-block": {
    page: "admissions",
    key: "download",
    data: {
      heading: "Download the Kedland admission form",
      body: "Complete it at home and return it to the school office with your child's documents.",
      buttonLabel: "Download the Admission Form (PDF)",
      note: "Prefer to talk first? Contact us and we'll guide you through it.",
    },
  },
  timeline: {
    page: "student-life",
    key: "day",
    data: {
      heading: "A day in the life of a Star",
      intro:
        "At Kedland, we pride ourselves on a vibrant, inclusive community. Everything we do is centred on our Stars — thoughtfully designed to give them a well-rounded start and set them up for a bright future.",
      moments: [
        {
          icon: "sun",
          title: "Warm welcome",
          body: "Every child is greeted by name — the day starts with a smile, a song and a calm settle-in.",
        },
        {
          icon: "book",
          title: "Circle & story time",
          body: "We gather to share news, sing, and dive into a story — building language, listening and belonging.",
        },
        {
          icon: "sparkle",
          title: "Learning through play & inquiry",
          body: "Guided, hands-on activities across the day's themes — exploring, questioning and discovering rather than reciting.",
        },
        {
          icon: "utensils",
          title: "Snack & outdoor play",
          body: "Healthy snacks and plenty of active outdoor time to run, climb and make friends.",
        },
        {
          icon: "palette",
          title: "Creative time",
          body: "Art, music, movement or building — because little hands and big imaginations need room to create.",
        },
        {
          icon: "moon",
          title: "Rest & reflect",
          body: "Quiet time for our youngest Stars; a gentle wind-down and a look back at what we learned.",
        },
        {
          icon: "heart",
          title: "Home time",
          body: "A safe, orderly pickup — or stay on for our after-school programme.",
        },
      ],
    },
  },
  "chips-band": {
    page: "student-life",
    key: "clubs",
    data: {
      heading: "Beyond the classroom",
      body: "Kedland goes beyond the tutoring class. In line with our mission and vision, we encourage every Star to explore a wide range of extracurricular activities — from sport to art and craft — that match their interests. Our Stars are free to explore their creativity, develop new skills and build lasting friendships.",
      chips: [
        "Sports & games",
        "Art & craft",
        "Music",
        "Dance",
        "Reading club",
        "Creative play",
        "Field trips",
      ],
    },
  },
  "news-intro": {
    page: "news",
    key: "intro",
    data: {
      heading: "News & Stars in Action",
      body: "The latest news, events and stories from Kedland International School.",
      emptyStateHeading: "New stories coming soon",
      emptyStateBody:
        "We are just getting started. In the meantime, follow us on Instagram to see what our Stars are up to.",
    },
  },
  "contact-details": {
    page: "contact",
    key: "details",
    data: {
      heading: "Come and see us",
      body: "We are in Community 19 Annex, Lashibi-Tema, near Deon Recreational Centre. Call or message us any weekday, or send us a note using the form and we will come back to you.",
      formHeading: "Send us a message",
      mapHeading: "Find us",
    },
  },
  "faq-intro": {
    page: "faqs",
    key: "intro",
    data: {
      heading: "Frequently asked questions",
      body: "Admissions, curriculum, school life and the practical details. If your question is not here, please just ask — we are happy to help.",
      closingHeading: "Still have a question?",
      closingCta: {
        label: "Contact us",
        href: "/contact",
      },
    },
  },
  legal: {
    page: "privacy",
    key: "notice",
    data: {
      heading: "Privacy Notice",
      body: "Kedland International School collects only the information you choose to send us. When you use the contact form on this website we collect your name, email address, phone number, the subject of your enquiry, any details you give about your child, and your message. We use this solely to reply to you and to talk with you about your enquiry. We do not sell your information, and we do not share it with anyone outside the school except the service we use to deliver our email. We keep enquiries for as long as we need them to help you, and then we remove them. Photographs of children appear on this website only where a parent or guardian has given written consent, in line with Ghana's Data Protection Act. If you would like to know what information we hold about you, to correct it, or to have it removed, please contact the school and we will help. This notice is awaiting the school's final approval and may be updated before launch.",
      lastUpdated: "Pending approval",
    },
  },
};

export const SECTION_FIXTURES: SectionFixture[] = Object.entries(FIXTURES).map(([type, fixture]) => ({
  type,
  ...fixture,
}));

/** Throws if any fixture no longer matches the schema it claims to be. */
export function assertFixturesValid(): void {
  for (const fixture of SECTION_FIXTURES) {
    const result = validateSectionData(fixture.page, fixture.key, fixture.data);
    if (!result.success) {
      throw new Error(
        `Fixture ${fixture.page}/${fixture.key} (${fixture.type}) no longer matches its schema:\n${result.error.message}`,
      );
    }
  }
}
