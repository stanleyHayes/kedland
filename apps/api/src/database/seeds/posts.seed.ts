import type { PostCategory } from "@kedland/types";

export interface StarterPost {
  title: string;
  slug: string;
  category: PostCategory;
  excerpt: string;
  body: string;
  coverImage: { mediaId: string; alt: string };
  publishedAt: Date;
}

const cover = {
  classroom: {
    mediaId: "placeholder-hero",
    alt: "A bright early-years classroom prepared with books, blocks and child-sized tables",
  },
  creative: {
    mediaId: "kedland-starter-creative-table",
    alt: "A creative learning table with paints, paper shapes and child-made artwork",
  },
  reading: {
    mediaId: "kedland-starter-reading-corner",
    alt: "A sunlit reading corner with picture books, soft cushions and wooden stars",
  },
  garden: {
    mediaId: "placeholder-admissions",
    alt: "A green school play garden with safe climbing equipment and shaded seating",
  },
  discovery: {
    mediaId: "kedland-starter-discovery-table",
    alt: "A maths and science discovery table with counting, weighing and nature materials",
  },
  music: {
    mediaId: "kedland-starter-music-corner",
    alt: "A music and movement corner with drums, ribbons, shakers and a xylophone",
  },
} as const;

export const POST_SEED: readonly StarterPost[] = [
  {
    title: "A joyful start to the new school term",
    slug: "a-joyful-start-to-the-new-school-term",
    category: "news",
    excerpt: "Our Stars returned to bright classrooms, familiar routines and a term full of discovery.",
    body: "The first morning of term began with warm welcomes, classroom tours and time to reconnect.\n\nAcross the school, teachers introduced the questions and projects that will shape the weeks ahead. Our youngest Stars explored their learning corners through play, while primary classes began setting goals for the term.\n\nFamilies can follow important dates through school notices and contact the office whenever a routine needs clarification.",
    coverImage: cover.classroom,
    publishedAt: new Date("2026-07-21T08:00:00.000Z"),
  },
  {
    title: "Young artists turn everyday shapes into stories",
    slug: "young-artists-turn-everyday-shapes-into-stories",
    category: "learning",
    excerpt: "Paper, paint and imagination became a lively lesson in colour, language and collaboration.",
    body: "Our early-years artists began with simple paper shapes and a question: what could these become?\n\nChildren planned pictures, mixed colours and explained their ideas to friends. The activity strengthened fine-motor control and vocabulary while leaving plenty of room for original thinking.\n\nThe finished pieces now bring a cheerful burst of colour to the learning space.",
    coverImage: cover.creative,
    publishedAt: new Date("2026-07-17T09:30:00.000Z"),
  },
  {
    title: "Why daily reading time matters",
    slug: "why-daily-reading-time-matters",
    category: "learning",
    excerpt: "Small, regular reading moments help children grow confidence, vocabulary and curiosity.",
    body: "Reading is part of every school day at Kedland. Sometimes a teacher reads aloud; sometimes children explore picture books together or choose a quiet independent read.\n\nThese repeated moments build fluency and comprehension without turning books into a test. Families can help by sharing a story at home and asking open questions about characters, pictures and ideas.",
    coverImage: cover.reading,
    publishedAt: new Date("2026-07-13T10:00:00.000Z"),
  },
  {
    title: "Family open morning announced",
    slug: "family-open-morning-announced",
    category: "events",
    excerpt:
      "Prospective families are invited to tour Kedland, meet the team and explore our learning spaces.",
    body: "Our next family open morning will offer a relaxed introduction to Kedland International School.\n\nVisitors can see classrooms and outdoor spaces, hear how our curriculum works and ask the admissions team practical questions about starting school.\n\nPlaces are limited so that every family has time for a proper conversation. Please book through the contact page.",
    coverImage: cover.garden,
    publishedAt: new Date("2026-07-09T07:30:00.000Z"),
  },
  {
    title: "Discovery tables make mathematics tangible",
    slug: "discovery-tables-make-mathematics-tangible",
    category: "learning",
    excerpt:
      "Counting, comparing and weighing become easier to understand when children can handle real materials.",
    body: "This week's discovery table invited children to sort natural objects, compare weights and record what they noticed.\n\nTeachers used questions rather than giving away answers. That approach helps children test an idea, notice a mistake and try again—habits that matter well beyond mathematics.",
    coverImage: cover.discovery,
    publishedAt: new Date("2026-07-04T11:00:00.000Z"),
  },
  {
    title: "Music and movement afternoon",
    slug: "music-and-movement-afternoon",
    category: "events",
    excerpt: "Rhythm, movement and teamwork filled the school during an energetic creative afternoon.",
    body: "Drums, ribbons, shakers and voices came together for a school-wide music and movement session.\n\nChildren copied rhythms, invented short patterns and worked in small groups to perform them. The afternoon supported listening and coordination while giving every child a joyful way to participate.",
    coverImage: cover.music,
    publishedAt: new Date("2026-06-29T13:00:00.000Z"),
  },
  {
    title: "Learning through purposeful play",
    slug: "learning-through-purposeful-play",
    category: "learning",
    excerpt:
      "A well-prepared play space gives young children serious opportunities to reason, communicate and create.",
    body: "Purposeful play is not time away from learning. It is one of the ways young children make sense of the world.\n\nWhen children build, role-play and solve shared problems, teachers can introduce language and ideas at exactly the moment they become meaningful. Careful observation then guides what comes next.",
    coverImage: cover.classroom,
    publishedAt: new Date("2026-06-23T08:45:00.000Z"),
  },
  {
    title: "Keeping children curious during the break",
    slug: "keeping-children-curious-during-the-break",
    category: "news",
    excerpt:
      "Simple family routines can keep curiosity alive without turning the holiday into another classroom.",
    body: "A walk, a recipe or a shared story can all become rich learning experiences.\n\nInvite children to estimate, notice patterns, ask questions and explain what they think. There is no need to recreate a school timetable; conversation and unhurried exploration are enough.",
    coverImage: cover.reading,
    publishedAt: new Date("2026-06-16T09:00:00.000Z"),
  },
  {
    title: "Our garden becomes an outdoor classroom",
    slug: "our-garden-becomes-an-outdoor-classroom",
    category: "news",
    excerpt:
      "The school garden is giving children new ways to observe change, care for living things and work together.",
    body: "Children have begun using the garden for observation, sketching and practical science.\n\nThey are learning to look closely, record changes and share responsibility for a living space. Outdoor learning also creates natural links between science, language and wellbeing.",
    coverImage: cover.garden,
    publishedAt: new Date("2026-06-10T10:15:00.000Z"),
  },
  {
    title: "Celebrating every small step",
    slug: "celebrating-every-small-step",
    category: "news",
    excerpt: "Progress is built from small moments of courage, practice and thoughtful encouragement.",
    body: "Not every important achievement arrives with a certificate. Reading a difficult sentence, joining a group or trying again after a mistake can be a major step.\n\nOur teachers notice these moments and help children recognise the effort behind them. That is how confidence becomes something sturdy rather than something dependent on being first.",
    coverImage: cover.creative,
    publishedAt: new Date("2026-06-03T08:00:00.000Z"),
  },
] as const;
