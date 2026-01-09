import { ReactNode } from "react";

type SectionVariant = "white" | "lightBlue" | "gray";

interface IdealoSectionProps {
  children: ReactNode;
  variant?: SectionVariant;
  className?: string;
}

const bgColors: Record<SectionVariant, string> = {
  white: "bg-white",
  lightBlue: "bg-[#f5f5f5]", // Light grey instead of light blue
  gray: "bg-[#f0f0f0]", // For future newsletter sections
};

export function IdealoSection({
  children,
  variant = "white",
  className = "",
}: IdealoSectionProps) {
  return (
    <section className={`py-6 ${bgColors[variant]} ${className}`}>
      <div className="mx-auto max-w-[1280px] px-4">{children}</div>
    </section>
  );
}
