export type TranscriptItem = {
  timestamp: string;
  text: string;
};

export const MOCK_VIDEO_DATA = {
  id: "mock-video-123",
  title: "Exploring the Wonders of the Arabic Language",
  transcript: [
    { timestamp: "00:02", text: "Welcome to our journey into the Arabic language." },
    { timestamp: "00:05", text: "It is a Semitic language with a rich history." },
    { timestamp: "00:09", text: "Spoken by over 420 million people worldwide." },
    { timestamp: "00:13", text: "The script is written from right to left." },
    { timestamp: "00:17", text: "One of its most unique features is the root system." },
    { timestamp: "00:21", text: "From a single root, many words can be derived." },
    { timestamp: "00:25", text: "For example, the root k-t-b relates to writing." },
    { timestamp: "00:29", text: "Kitab means book, and katib means writer." },
    { timestamp: "00:34", text: "This structure provides a deep logical consistency." },
    { timestamp: "00:39", text: "Thank you for joining this brief introduction." }
  ] as TranscriptItem[],
  translations: {
    "welcome": "أهلاً وسهلاً",
    "journey": "رحلة",
    "language": "لغة",
    "arabic": "العربية",
    "semitic": "سامية",
    "rich": "غني",
    "history": "تاريخ",
    "spoken": "يتحدث بها",
    "people": "الناس",
    "worldwide": "في جميع أنحاء العالم",
    "script": "الكتابة",
    "written": "مكتوبة",
    "right": "اليمين",
    "left": "اليسار",
    "unique": "فريدة",
    "features": "ميزات",
    "root": "جذر",
    "system": "نظام",
    "single": "واحد",
    "words": "كلمات",
    "derived": "مشتقة",
    "example": "مثال",
    "relates": "يتعلق",
    "writing": "الكتابة",
    "book": "كتاب",
    "writer": "كاتب",
    "structure": "بنية",
    "provides": "توفر",
    "deep": "عميق",
    "logical": "منطقي",
    "consistency": "اتساق",
    "thank": "شكراً",
    "joining": "الانضمام",
    "brief": "موجز",
    "introduction": "مقدمة"
  } as Record<string, string>
};
