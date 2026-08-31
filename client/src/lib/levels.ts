export type CourseLevel = "beginner" | "intermediate" | "advanced";

export const LEVEL_OPTIONS: { id: CourseLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export function levelBadgeClass(level?: string) {
  const key = String(level || "").toLowerCase();
  if (key === "intermediate") return "bg-[#FEF3C7] text-[#B45309]";
  if (key === "advanced") return "bg-[#FFE4E6] text-[#BE123C]";
  return "bg-[#DCFCE7] text-[#15803D]";
}

export function levelAccent(level?: string) {
  const key = String(level || "").toLowerCase();
  if (key === "intermediate") return { border: "border-[#FDBA74]", text: "text-[#EA580C]", tone: "orange" as const };
  if (key === "advanced") return { border: "border-[#FDA4AF]", text: "text-[#E11D48]", tone: "rose" as const };
  if (key === "beginner") return { border: "border-[#86EFAC]", text: "text-[#16A34A]", tone: "green" as const };
  return { border: "border-[#86EFAC]", text: "text-[#16A34A]", tone: "green" as const };
}
