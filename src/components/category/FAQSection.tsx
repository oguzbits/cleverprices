import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FAQItem } from "./FAQSchema";

interface FAQSectionProps {
  faqs: FAQItem[];
  categoryName: string;
}

/**
 * Visual FAQ Section Component
 * Displays FAQs in an accordion for user interaction
 * Works alongside FAQSchema for structured data
 */
export function FAQSection({ faqs, categoryName }: FAQSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="mb-6 text-xl font-bold">
        Frequently Asked Questions about {categoryName}
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`faq-${index}`}>
            <AccordionTrigger className="text-left text-base font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
