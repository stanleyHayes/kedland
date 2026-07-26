import type { FaqInput } from "@kedland/types";

export const FAQ_SEED: readonly FaqInput[] = [
  {
    group: "admissions",
    question: "What ages does Kedland International School accept?",
    answer:
      "Kedland welcomes children from our early-years programme through primary school. The admissions team will help you choose the right class from your child's age, previous school record and readiness.",
    order: 0,
    published: true,
  },
  {
    group: "admissions",
    question: "How do I begin an application?",
    answer:
      "Start with an enquiry or book a school tour. We will share the current application form, explain the documents required and arrange a friendly assessment where appropriate.",
    order: 1,
    published: true,
  },
  {
    group: "admissions",
    question: "Can my family visit the school before applying?",
    answer:
      "Yes. Tours are available by appointment on school days. Booking ahead lets us give you enough time to see the learning spaces and speak with the admissions team.",
    order: 2,
    published: true,
  },
  {
    group: "school-life",
    question: "What are the school hours?",
    answer:
      "The school office is open Monday to Friday from 7:00am to 5:00pm. Class and collection times vary by year group, and the office will confirm the timetable during admission.",
    order: 0,
    published: true,
  },
  {
    group: "school-life",
    question: "Is after-school care available?",
    answer:
      "After-school care is available by arrangement. Places and collection times are confirmed with the school office so that every child has a safe, supervised plan.",
    order: 1,
    published: true,
  },
  {
    group: "curriculum",
    question: "Which curriculum does Kedland follow?",
    answer:
      "Our teaching draws on the British curriculum and uses inquiry, practical exploration and purposeful play to help children understand ideas rather than memorise answers.",
    order: 0,
    published: true,
  },
  {
    group: "curriculum",
    question: "How does the school support different learning needs?",
    answer:
      "Teachers observe progress closely, adapt tasks and work with families on useful next steps. Where specialist support may help, the school discusses that openly with parents.",
    order: 1,
    published: true,
  },
  {
    group: "practical",
    question: "Where can I find the current fees?",
    answer:
      "Please contact admissions for the current fee schedule and availability. This ensures you receive the correct information for your child's year group and intended start date.",
    order: 0,
    published: true,
  },
  {
    group: "practical",
    question: "Are uniforms and meals included in tuition?",
    answer:
      "Items included with tuition can change by year group and term. The admissions team will give you a clear breakdown before you commit to a place.",
    order: 1,
    published: true,
  },
] as const;
