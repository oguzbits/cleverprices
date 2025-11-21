export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-8 md:py-12 mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">bestprices.today</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Compare products by price per unit to find the best value.
              Data-driven, neutral, and efficient.
            </p>
          </div>
          <div className="text-sm text-muted-foreground md:text-right">
            <p className="mb-2">
              bestprices.today is a participant in the Amazon Services LLC Associates Program, 
              an affiliate advertising program designed to provide a means for sites to earn 
              advertising fees by advertising and linking to Amazon.com and other Amazon locales.
            </p>
            <p>&copy; {new Date().getFullYear()} bestprices.today. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
