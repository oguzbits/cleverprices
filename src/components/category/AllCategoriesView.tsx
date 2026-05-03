import * as React from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryCard } from "@/components/ui/category-card";
import { Category } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/category-icons";
import { type CountryCode } from "@/lib/countries";

interface AllCategoriesViewProps {
  categoryHierarchy: {
    parent: Omit<Category, "icon">;
    children: Omit<Category, "icon">[];
  }[];
  countryCode: CountryCode;
}

export function AllCategoriesView({
  categoryHierarchy,
  countryCode,
}: AllCategoriesViewProps) {
  const breadcrumbItems = [
    {
      name: "Home",
      href: "/",
    },
    { name: "Alle Kategorien" },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="mb-14">
        <h1 className="mb-4 text-[32px] font-bold tracking-tight text-[#2d2d2d]">
          Alle Kategorien
        </h1>
        <p className="max-w-2xl text-lg text-[#767676]">
          Durchsuchen Sie unsere vollständige Liste der verfügbaren
          Produktkategorien und finden Sie die besten Preise.
        </p>
      </div>
      <div className="space-y-20">
        {categoryHierarchy.map((hierarchy) => (
          <section
            key={hierarchy.parent.slug}
            aria-labelledby={`${hierarchy.parent.slug}-heading`}
          >
            <div className="mb-8 flex items-center gap-4 border-b border-gray-100 pb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-[#2d2d2d]">
                {React.createElement(getCategoryIcon(hierarchy.parent.slug), {
                  className: "h-7 w-7",
                  "aria-hidden": "true",
                })}
              </div>
              <h2
                id={`${hierarchy.parent.slug}-heading`}
                className="text-[24px] font-bold text-[#2d2d2d]"
              >
                {hierarchy.parent.name}
              </h2>
              <span className="ml-auto text-sm font-medium text-[#767676]">
                {hierarchy.children.length}{" "}
                {hierarchy.children.length === 1 ? "Kategorie" : "Kategorien"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hierarchy.children.map((category) => (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  Icon={getCategoryIcon(category.slug)}
                  country={countryCode}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
