import type { Metadata } from "next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions | realpricedata.com",
  description: "Find answers to common questions about realpricedata.com, price per unit comparison, and how to find the best deals.",
  alternates: {
    canonical: 'https://realpricedata.com/faq',
  },
}

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
      
      <div className="prose prose-invert max-w-none mb-8">
        <p className="text-lg text-muted-foreground">
          Common questions about our price comparison engine and data.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>What is realpricedata.com?</AccordionTrigger>
          <AccordionContent>
            realpricedata.com is a specialized price comparison engine that focuses on the "price per unit" 
            (e.g., price per Terabyte, price per Liter, price per Kilogram). Unlike standard price comparison 
            sites that just show the total price, we help you find the true best value by standardizing the cost.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>How is the "price per unit" calculated?</AccordionTrigger>
          <AccordionContent>
            We automatically extract the quantity information (capacity, weight, volume, or count) from product 
            listings and divide the current price by this amount. This gives you a comparable metric (like €/TB or €/kg) 
            to easily spot which product offers the most for your money, regardless of package size.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>Where do these prices come from?</AccordionTrigger>
          <AccordionContent>
            We use Amazon's Product Advertising API to retrieve product information directly from Amazon. 
            This ensures that the data we display is legitimate and sourced directly from the retailer.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger>How often is this site updated?</AccordionTrigger>
          <AccordionContent>
            Prices are updated regularly throughout the day. However, Amazon prices can change at any moment. 
            We always recommend verifying the final price on the Amazon product page before making a purchase.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger>Why doesn't this product appear on your site?</AccordionTrigger>
          <AccordionContent>
            We aggressively filter our product list to remove duplicates, spam, and out-of-stock listings. 
            In some cases, our algorithms might not correctly classify a product, leading to its exclusion. 
            We also have limits on how many items we can retrieve via the API. If you think a product is missing, 
            it might have been filtered out for quality control or API limitation reasons.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6">
          <AccordionTrigger>Why shouldn't I buy the cheapest product?</AccordionTrigger>
          <AccordionContent>
            Price is a major factor, but it isn't everything. The cheapest product per unit might have a shorter warranty, 
            lower build quality, or come from a less known brand. For example, with hard drives, a cheaper drive might be 
            slower or less reliable. We provide the data to help you compare, but we recommend considering factors like 
            reviews, warranty, and brand reputation alongside the price per unit.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-7">
          <AccordionTrigger>What about shipping?</AccordionTrigger>
          <AccordionContent>
            The prices listed here do not include shipping costs or potential taxes, as these depend on your location 
            and the specific seller. Many items may qualify for free shipping (especially with Amazon Prime), but you 
            should always check the final total including shipping on Amazon before ordering.
          </AccordionContent>
        </AccordionItem>



        <AccordionItem value="item-8">
          <AccordionTrigger>Is this an ad?</AccordionTrigger>
          <AccordionContent>
            We participate in the Amazon Associates Program. This means we earn commissions for qualifying purchases 
            made through the links on this site. This revenue supports the server costs and development of the project 
            at no extra cost to you.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
