import {
  HardDrive,
  MemoryStick,
  Zap,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export const categoryIcons: Record<string, LucideIcon> = {
  electronics: HardDrive,
  "hard-drives": HardDrive,
  ram: MemoryStick,
  "power-supplies": Zap,
  default: HelpCircle,
};

export function getCategoryIcon(slug: string): LucideIcon {
  return categoryIcons[slug] || categoryIcons.default;
}
