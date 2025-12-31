import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { type CountryCode } from "@/lib/countries";
import * as React from "react";

interface PageLayoutProps {
  children: React.ReactNode;
  country: string | CountryCode;
}

export function PageLayout({ children, country }: PageLayoutProps) {
  return (
    <>
      <Navbar country={country} />
      <main className="flex-1">
        {children}
      </main>
      <Footer country={country} />
    </>
  );
}
