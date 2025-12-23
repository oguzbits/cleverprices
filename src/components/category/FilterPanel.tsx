import * as React from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryFilterOptions } from "@/lib/utils/category-utils";

interface FilterPanelProps {
  filters: {
    condition: string[];
    technology: string[];
    formFactor: string[];
    minCapacity: number | null;
    maxCapacity: number | null;
  };
  onFilterChange: (name: string, value: string) => void;
  onCapacityChange: (min: number | null, max: number | null) => void;
  unitLabel: string;
  categorySlug: string;
}

export function FilterPanel({
  filters,
  onFilterChange,
  onCapacityChange,
  unitLabel,
  categorySlug,
}: FilterPanelProps) {
  const { techOptions, formFactorOptions } = getCategoryFilterOptions(categorySlug);

  return (
    <Card className="p-4 border-none shadow-none lg:border lg:shadow-sm">
      <CardContent className="p-0">
        <h2 className="sr-only">Filters</h2>
        <Accordion type="multiple" defaultValue={["condition", "capacity", "technology", "form-factor"]} className="w-full">
          {/* Condition Filter */}
          <AccordionItem value="condition" className="border-b">
            <AccordionTrigger className="text-base font-semibold hover:no-underline pb-3 pt-0">Condition</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 pt-1 pb-3">
                {["New", "Used", "Renewed"].map((condition) => (
                  <div key={condition} className="flex items-center space-x-3 py-1.5">
                    <Checkbox
                      id={`condition-${condition}`}
                      checked={filters.condition?.includes(condition) || false}
                      onCheckedChange={() => onFilterChange('condition', condition)}
                    />
                    <Label htmlFor={`condition-${condition}`} className="text-base font-normal leading-none cursor-pointer">{condition}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Capacity Filter */}
          <AccordionItem value="capacity" className="border-b">
            <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">Capacity ({unitLabel})</AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center gap-2 pt-1 pb-3">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minCapacity ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null;
                      onCapacityChange(val, filters.maxCapacity ?? null);
                    }}
                    className="w-full pr-8 bg-white dark:bg-secondary/40 shadow-sm transition-colors"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">{unitLabel}</span>
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxCapacity ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null;
                      onCapacityChange(filters.minCapacity ?? null, val);
                    }}
                    className="w-full pr-8 bg-white dark:bg-secondary/40 shadow-sm transition-colors"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">{unitLabel}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Technology Filter */}
          <AccordionItem value="technology" className="border-b">
            <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">
              {categorySlug === 'power-supplies' ? 'Certification' : 'Technology'}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 pt-1 pb-3">
                {techOptions.map((tech) => (
                  <div key={tech} className="flex items-center space-x-3 py-1.5">
                    <Checkbox
                      id={`tech-${tech}`}
                      checked={filters.technology?.includes(tech) || false}
                      onCheckedChange={() => onFilterChange('technology', tech)}
                    />
                    <Label htmlFor={`tech-${tech}`} className="text-base font-normal leading-none cursor-pointer">{tech}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Form Factor Filter */}
          <AccordionItem value="form-factor" className="border-none">
            <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">Form Factor</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 pt-1 pb-3">
                {formFactorOptions.map((ff) => (
                  <div key={ff} className="flex items-center space-x-3 py-1.5">
                    <Checkbox
                      id={`ff-${ff}`}
                      checked={filters.formFactor?.includes(ff) || false}
                      onCheckedChange={() => onFilterChange('formFactor', ff)}
                    />
                    <Label htmlFor={`ff-${ff}`} className="text-base font-normal leading-none cursor-pointer">{ff}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
