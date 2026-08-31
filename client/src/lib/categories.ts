import {
  Atom,
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  Camera,
  ChartColumn,
  Code2,
  Compass,
  Cpu,
  Database,
  Dna,
  FlaskConical,
  Globe,
  HeartPulse,
  Landmark,
  Languages,
  Leaf,
  Lightbulb,
  Megaphone,
  Microscope,
  MoonStar,
  Music,
  Palette,
  Puzzle,
  Rocket,
  Scale,
  Sprout,
  Target,
  Terminal,
  type LucideIcon,
} from "lucide-react";

export type CourseCategoryDef = {
  id: string;
  label: string;
  Icon: LucideIcon;
  iconClass: string;
  chipClass: string;
};

function def(id: string, Icon: LucideIcon, iconClass: string, chipClass: string): CourseCategoryDef {
  return { id, label: id, Icon, iconClass, chipClass };
}

export const COURSE_CATEGORIES: CourseCategoryDef[] = [
  def("Programming", Code2, "text-[#2563EB]", "bg-[#DBEAFE]"),
  def("Data Science", Database, "text-[#0284C7]", "bg-[#E0F2FE]"),
  def("Design", Palette, "text-[#DB2777]", "bg-[#FCE7F3]"),
  def("Business", Briefcase, "text-[#B45309]", "bg-[#FEF3C7]"),
  def("AI & ML", Brain, "text-[#16A34A]", "bg-[#DCFCE7]"),
  def("Math", Calculator, "text-[#EA580C]", "bg-[#FFEDD5]"),
  def("Language", Languages, "text-[#0D9488]", "bg-[#CCFBF1]"),
  def("Science", FlaskConical, "text-[#0891B2]", "bg-[#CFFAFE]"),
  def("Biology", Dna, "text-[#059669]", "bg-[#D1FAE5]"),
  def("Physics", Atom, "text-[#4F46E5]", "bg-[#E0E7FF]"),
  def("Personal Development", Sprout, "text-[#C026D3]", "bg-[#FAE8FF]"),
  def("Marketing", Megaphone, "text-[#2563EB]", "bg-[#DBEAFE]"),
  def("Health", HeartPulse, "text-[#E11D48]", "bg-[#FFE4E6]"),
];

const KEYWORD_ICONS: { test: RegExp; Icon: LucideIcon; iconClass: string; chipClass: string }[] = [
  { test: /python|javascript|typescript|java\b|kotlin|swift|rust|golang|\bgo\b|php|ruby|html|css|react|node|c\+\+|csharp|c#|coding|program|software|web.?dev|computer|frontend|backend/, Icon: Code2, iconClass: "text-[#2563EB]", chipClass: "bg-[#DBEAFE]" },
  { test: /terminal|linux|devops|cloud|cyber|hack/, Icon: Terminal, iconClass: "text-[#1D4ED8]", chipClass: "bg-[#DBEAFE]" },
  { test: /hardware|electron|embed|robot|iot/, Icon: Cpu, iconClass: "text-[#2563EB]", chipClass: "bg-[#DBEAFE]" },
  { test: /data sci|dataset|analytics|pandas|tableau|excel|statistic|bi\b/, Icon: ChartColumn, iconClass: "text-[#0284C7]", chipClass: "bg-[#E0F2FE]" },
  { test: /database|sql|mongo|warehouse/, Icon: Database, iconClass: "text-[#0284C7]", chipClass: "bg-[#E0F2FE]" },
  { test: /\bai\b|machine learn|deep learn|neural|llm|ml\b/, Icon: Brain, iconClass: "text-[#16A34A]", chipClass: "bg-[#DCFCE7]" },
  { test: /biolog|cell|genetic|anatomy|organism|dna|life sci/, Icon: Dna, iconClass: "text-[#059669]", chipClass: "bg-[#D1FAE5]"},
  { test: /microscop|lab|experiment/, Icon: Microscope, iconClass: "text-[#0F766E]", chipClass: "bg-[#CCFBF1]" },
  { test: /chem|molecule/, Icon: FlaskConical, iconClass: "text-[#0891B2]", chipClass: "bg-[#CFFAFE]" },
  { test: /physic|motion|force|quantum|atom/, Icon: Atom, iconClass: "text-[#4F46E5]", chipClass: "bg-[#E0E7FF]" },
  { test: /math|algebra|calculus|geometry|arith|number/, Icon: Calculator, iconClass: "text-[#EA580C]", chipClass: "bg-[#FFEDD5]" },
  { test: /personal|self.?help|mindset|productiv|life skill|habit|growth/, Icon: Sprout, iconClass: "text-[#C026D3]", chipClass: "bg-[#FAE8FF]" },
  { test: /business|mba|entrepren|manag|compan|startup|leader/, Icon: Briefcase, iconClass: "text-[#B45309]", chipClass: "bg-[#FEF3C7]" },
  { test: /market|sales|advert|brand/, Icon: Megaphone, iconClass: "text-[#2563EB]", chipClass: "bg-[#DBEAFE]" },
  { test: /design|ui|ux|figma|graphic|illustrat/, Icon: Palette, iconClass: "text-[#DB2777]", chipClass: "bg-[#FCE7F3]" },
  { test: /health|fitness|sport|wellness|nutrition|yoga/, Icon: HeartPulse, iconClass: "text-[#E11D48]", chipClass: "bg-[#FFE4E6]" },
  { test: /faith|islam|iman|religion|quran/, Icon: MoonStar, iconClass: "text-[#0D9488]", chipClass: "bg-[#CCFBF1]" },
  { test: /music|audio/, Icon: Music, iconClass: "text-[#7C3AED]", chipClass: "bg-[#EDE9FE]" },
  { test: /history|geo|world|culture/, Icon: Globe, iconClass: "text-[#0284C7]", chipClass: "bg-[#E0F2FE]" },
  { test: /finance|account|econ|money|invest/, Icon: Landmark, iconClass: "text-[#16A34A]", chipClass: "bg-[#DCFCE7]" },
  { test: /english|speak|write|lang|arabic|french|spanish/, Icon: Languages, iconClass: "text-[#0D9488]", chipClass: "bg-[#CCFBF1]" },
  { test: /photo|video|media|film/, Icon: Camera, iconClass: "text-[#EA580C]", chipClass: "bg-[#FFEDD5]" },
  { test: /law|legal|civic/, Icon: Scale, iconClass: "text-[#1D4ED8]", chipClass: "bg-[#DBEAFE]" },
  { test: /environ|climate|ecolog|plant|agricult/, Icon: Leaf, iconClass: "text-[#16A34A]", chipClass: "bg-[#DCFCE7]" },
  { test: /book|read|literat|educat/, Icon: BookOpen, iconClass: "text-[#2563EB]", chipClass: "bg-[#DBEAFE]" },
];

const FALLBACK_ICONS: { Icon: LucideIcon; iconClass: string; chipClass: string }[] = [
  { Icon: Lightbulb, iconClass: "text-[#D97706]", chipClass: "bg-[#FEF3C7]" },
  { Icon: Compass, iconClass: "text-[#0D9488]", chipClass: "bg-[#CCFBF1]" },
  { Icon: Target, iconClass: "text-[#E11D48]", chipClass: "bg-[#FFE4E6]" },
  { Icon: Rocket, iconClass: "text-[#7C3AED]", chipClass: "bg-[#EDE9FE]" },
  { Icon: Puzzle, iconClass: "text-[#0284C7]", chipClass: "bg-[#E0F2FE]" },
];

const ALIASES: Record<string, string> = {
  mathematics: "Math",
  maths: "Math",
  coding: "Programming",
  "computer science": "Programming",
  cs: "Programming",
  "machine learning": "AI & ML",
  ai: "AI & ML",
  "personal growth": "Personal Development",
  "self development": "Personal Development",
  "life skills": "Personal Development",
  marketing: "Marketing",
  "data analytics": "Data Science",
  biology: "Biology",
  physics: "Physics",
  chemistry: "Science",
};

function hashName(value: string) {
  let hash = 0;
  for (const ch of value) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash;
}

export function categoryDef(name: string): CourseCategoryDef {
  const raw = name.trim() || "Category";
  const key = raw.toLowerCase();
  const aliased = ALIASES[key];
  const found = COURSE_CATEGORIES.find(
    (c) => c.id.toLowerCase() === key || c.label.toLowerCase() === key || (aliased && c.id.toLowerCase() === aliased.toLowerCase())
  );
  if (found) return { ...found, id: raw, label: raw === found.id ? found.label : raw };
  const matched = KEYWORD_ICONS.find((row) => row.test.test(key));
  if (matched) return { id: raw, label: raw, Icon: matched.Icon, iconClass: matched.iconClass, chipClass: matched.chipClass };
  const pick = FALLBACK_ICONS[hashName(key) % FALLBACK_ICONS.length];
  return { id: raw, label: raw, Icon: pick.Icon, iconClass: pick.iconClass, chipClass: pick.chipClass };
}

const EXTRA_KEY = "extraCourseCategories";

export function readExtraCategories(): string[] {
  try {
    const raw = localStorage.getItem(EXTRA_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.from(new Set((Array.isArray(parsed) ? parsed : []).map((n) => String(n).trim()).filter(Boolean)));
  } catch {
    return [];
  }
}

export function saveExtraCategory(name: string) {
  const next = Array.from(new Set([...readExtraCategories(), name.trim()].filter(Boolean)));
  localStorage.setItem(EXTRA_KEY, JSON.stringify(next));
  return next;
}

export function renameExtraCategory(from: string, to: string) {
  const next = Array.from(
    new Set(readExtraCategories().map((n) => (n.toLowerCase() === from.toLowerCase() ? to.trim() : n)).filter(Boolean))
  );
  if (!COURSE_CATEGORIES.some((c) => c.id.toLowerCase() === to.trim().toLowerCase())) {
    next.push(to.trim());
  }
  localStorage.setItem(EXTRA_KEY, JSON.stringify(Array.from(new Set(next))));
  return readExtraCategories();
}

export function removeExtraCategory(name: string) {
  const next = readExtraCategories().filter((n) => n.toLowerCase() !== name.trim().toLowerCase());
  localStorage.setItem(EXTRA_KEY, JSON.stringify(next));
  return next;
}

const HIDDEN_KEY = "hiddenCourseCategories";

export function readHiddenCategories(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.map((n) => String(n).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function hideCategory(name: string) {
  const next = Array.from(new Set([...readHiddenCategories(), name.trim()].filter(Boolean)));
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
  return next;
}

export function isHiddenCategory(name: string) {
  return readHiddenCategories().some((n) => n.toLowerCase() === name.trim().toLowerCase());
}

export function isCanonicalCategory(name: string) {
  return COURSE_CATEGORIES.some((c) => c.id.toLowerCase() === name.trim().toLowerCase());
}

export function listVisibleAdminCategories(opts: {
  extras: string[];
  catalogNames: string[];
  counts: Record<string, number>;
  hidden?: string[];
}): CourseCategoryDef[] {
  const extras = opts.extras;
  const hidden = opts.hidden || readHiddenCategories();
  const extraNames = [...extras, ...opts.catalogNames]
    .filter((n, i, arr) => n && arr.findIndex((x) => x.toLowerCase() === n.toLowerCase()) === i)
    .filter((n) => !COURSE_CATEGORIES.some((c) => c.id.toLowerCase() === n.toLowerCase()));

  return [...COURSE_CATEGORIES, ...extraNames.map((n) => categoryDef(n))].filter((chip) => {
    if (hidden.some((n) => n.toLowerCase() === chip.id.toLowerCase())) return false;
    const count = Object.entries(opts.counts).reduce(
      (sum, [key, n]) => (key.toLowerCase() === chip.id.toLowerCase() ? sum + n : sum),
      0
    );
    const added = extras.some((e) => e.toLowerCase() === chip.id.toLowerCase());
    return added || count > 0;
  });
}
