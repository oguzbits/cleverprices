import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { getFlag } from "@/lib/countries";
import { cn } from "@/lib/utils";

interface CountryItemProps {
  code: string;
  name: string;
  domain: string;
  isLive: boolean;
  isActive?: boolean;
}

export function CountryItem({
  code,
  name,
  domain,
  isLive,
  isActive,
}: CountryItemProps) {
  return (
    <div className={cn("flex w-full items-center justify-between")}>
      <div className={cn("flex items-center gap-3")}>
        <Image
          src={getFlag(code)}
          alt={name}
          width={24}
          height={16}
          className={cn("h-4 w-6 object-cover shadow-sm")}
        />
        <div className={cn("flex flex-col")}>
          <span className={cn("font-medium")}>{name}</span>
          <span className={cn("text-muted-foreground text-sm")}>{domain}</span>
        </div>
      </div>
      <div className={cn("flex items-center gap-2")}>
        {isActive ? (
          <Badge
            variant="secondary"
            className={cn(
              "bg-emerald-100 text-sm text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
            )}
          >
            Active
          </Badge>
        ) : !isLive ? (
          <Badge
            variant="outline"
            className={cn(
              "text-muted-foreground text-[10px] font-medium uppercase",
            )}
          >
            Soon
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
