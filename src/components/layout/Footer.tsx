import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-8 md:py-12 mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">bestprices.today</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Compare products by price per unit to find the best value.
              Data-driven, neutral, and efficient.
            </p>
          </div>

          <div className="text-sm">
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/impressum" className="text-muted-foreground hover:text-primary transition-colors">
                  Impressum / Legal Notice
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-muted-foreground hover:text-primary transition-colors">
                  Datenschutz / Privacy
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-sm text-muted-foreground md:text-right">
            <p className="mb-4 text-xs">
              As an Amazon Associate, we earn from qualifying purchases. Amazon and the Amazon logo are 
              trademarks of Amazon.com, Inc. or its affiliates.
            </p>
            <p>&copy; {new Date().getFullYear()} bestprices.today. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
