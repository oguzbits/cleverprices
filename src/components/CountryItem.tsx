import { Badge } from "@/components/ui/badge";
import { getFlag } from "@/lib/countries";
import Image from "next/image";

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
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3">
        <Image
          src={getFlag(code)}
          alt={name}
          width={24}
          height={16}
          className="h-4 w-6 object-cover shadow-sm"
        />
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          <span className="text-muted-foreground text-sm">{domain}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isActive ? (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-sm text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
          >
            Active
          </Badge>
        ) : !isLive ? (
          <Badge variant="outline" className="text-muted-foreground text-[10px] font-medium uppercase">
            Soon
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
