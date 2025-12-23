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
      
      <div className="prose dark:prose-invert max-w-none mb-8">
        <p className="text-lg text-muted-foreground">
          Common questions about our price comparison engine and data.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-left font-semibold">What is realpricedata.com?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            realpricedata.com is a specialized price comparison engine that focuses on the "price per unit" 
            (e.g., price per Terabyte, price per Gigabyte, or price per item). Unlike standard price comparison 
            sites that just show the total price, we help you find the true best value by standardizing the cost across different package sizes and capacities.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="text-left font-semibold">How is the "price per unit" calculated for RAM and SSDs?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            We automatically extract quantity information (like 2TB for an SSD or 32GB for a RAM kit) 
            and divide the current market price by this amount. This gives you a comparable metric (like €/TB or €/GB) 
            to easily spot which product offers the most value. We track these metrics daily to ensure you find the best deals.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="text-left font-semibold">Where does the price data come from?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            We use official APIs (like Amazon's Product Advertising API) to retrieve pricing and availability directly from major retailers. 
            This ensures that the data we display is accurate and sourced directly from the merchant.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="text-left font-semibold">How often are hardware prices updated?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Currently, our prices are updated every 24 hours. We are working on increasing this frequency to multiple times 
            per day in the future. Because hardware markets (especially memory and storage) can be volatile, 
            we always recommend clicking through to the retailer to verify the final price before checking out.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger className="text-left font-semibold">Why are RAM and SSD prices rising in 2025?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            The global memory market is currently undergoing a structural shift driven by the explosion of AI. 
            Manufacturers are redirecting production capacity toward high-margin enterprise memory, reducing 
            the supply for consumer-grade DDR4, DDR5, and SSDs. Read our full analysis on 
            <a href="/blog/ram-ssd-price-trends-2025" className="text-primary hover:underline ml-1">
              Why RAM and SSD Prices Are Rising in 2025
            </a>.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6">
          <AccordionTrigger className="text-left font-semibold">How can I find the best Price per Terabyte (TB)?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            You can use our <a href="/de/electronics/hard-drives" className="text-primary hover:underline">Hard Drive & SSD</a> comparison pages 
            and sort by "Value (Price per Unit)". This will instantly rank all available storage products by their actual cost per TB, 
            allowing you to save money regardless of the total drive capacity.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-7">
          <AccordionTrigger className="text-left font-semibold">Do you provide market analysis and buying guides?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Yes! Our <a href="/blog" className="text-primary hover:underline">Blog</a> features in-depth articles on hardware market trends, 
            pricing predictions, and evergreen tips on how to optimize your PC builds for the best value. We focus on data-driven 
            insights for storage, memory, and other high-volatility hardware.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-8">
          <AccordionTrigger className="text-left font-semibold">Why shouldn't I just buy the cheapest product on the list?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            The "Best Price per Unit" is a powerful value indicator, but you should also consider brand reputation, 
            warranty length, and performance specs (like NVMe speeds vs SATA). Our data helps you find the most efficient 
            deals, but we always encourage checking user reviews for reliability before making a final decision.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-9">
          <AccordionTrigger className="text-left font-semibold">How do I filter for specific hardware like DDR5 or NVMe?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            On any category page, use the side filters (or the filter icon on mobile) to narrow down by technology 
            (e.g., <a href="/de/electronics/ram?technology=DDR5" className="text-primary hover:underline">DDR5</a>) or 
            form factor (e.g., <a href="/de/electronics/hard-drives?formFactor=M.2+NVMe" className="text-primary hover:underline">M.2 NVMe</a>). 
            Our engine will keep calculating the unit price even as you apply multiple filters.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-10">
          <AccordionTrigger className="text-left font-semibold">Is realpricedata.com free to use?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Yes, it is completely free for users. We are supported by the Amazon Associates Program, earning a small 
            commission on qualifying purchases made through our links. This revenue allows us to maintain the data infrastructure 
            and keep provide unbiased value metrics to the community.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-11">
          <AccordionTrigger className="text-left font-semibold">Can I view historical price data for products?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            Currently, our focus is on providing current market data to help you find the best value today. 
            We do not provide historical price charts, and this is not a feature we currently have planned. Our engine is 
            specifically optimized to simplify the decision-making process for current purchases by standardizing pricing across different capacities.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
