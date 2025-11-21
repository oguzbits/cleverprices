"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Star, Filter, ArrowUpDown, ExternalLink, Search } from "lucide-react"

// Mock Data Generator
const generateProducts = (count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    const price = Math.random() * 200 + 50
    const unitPrice = price / (Math.random() * 500 + 100)
    return {
      id: i,
      name: `High Performance Product ${i + 1} - ${Math.floor(Math.random() * 1000)}GB`,
      price: price.toFixed(2),
      unitPrice: unitPrice.toFixed(3),
      unit: "GB",
      rating: (Math.random() * 2 + 3).toFixed(1),
      reviews: Math.floor(Math.random() * 5000),
      updated: `${Math.floor(Math.random() * 12)}h ago`,
      merchant: "Amazon",
      isBestValue: i === 0 || i === 5,
      brand: ["Samsung", "Western Digital", "Seagate", "Crucial", "SanDisk"][Math.floor(Math.random() * 5)],
    }
  })
}

const allProducts = generateProducts(50)

export default function SubcategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortBy, setSortBy] = React.useState("price-per-unit")

  // Filter and Sort Logic (Mock)
  const filteredProducts = React.useMemo(() => {
    let data = [...allProducts]
    if (searchTerm) {
      data = data.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (sortBy === "price-per-unit") {
      data.sort((a, b) => parseFloat(a.unitPrice) - parseFloat(b.unitPrice))
    } else if (sortBy === "price-asc") {
      data.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    } else if (sortBy === "rating") {
      data.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    }
    return data
  }, [searchTerm, sortBy])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>Categories</span>
              <span>/</span>
              <span className="capitalize">{slug?.replace("-", " ")}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">{slug?.replace("-", " ")} Price Comparison</h1>
            <p className="text-muted-foreground">
              Comparing {filteredProducts.length} products by price per unit. Updated hourly.
            </p>
          </div>
          <div className="text-xs text-muted-foreground text-right hidden md:block">
            <p>Last scan: 12 mins ago</p>
            <p>Next scan: 48 mins</p>
          </div>
        </div>

        {/* Sticky Filter Bar */}
        <div className="sticky top-14 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-y py-4 -mx-4 px-4 md:mx-0 md:px-0 md:rounded-lg md:border shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-per-unit">Price / Unit (Low to High)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="rating">Rating (High to Low)</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Brand</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Rating</Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Price Range</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Price / Unit</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right hidden md:table-cell">Rating</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Merchant</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="group">
                  <TableCell>
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      IMG
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-primary transition-colors cursor-pointer">
                        {product.name}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground md:hidden">
                        <div className="flex items-center">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          {product.rating}
                        </div>
                        <span>•</span>
                        <span>{product.merchant}</span>
                      </div>
                      {product.isBestValue && (
                        <Badge variant="secondary" className="w-fit mt-1 text-[10px] h-5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-100">
                          Best Value
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-bold text-lg text-primary">
                      ${product.unitPrice}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      per {product.unit}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${product.price}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-medium">{product.rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">({product.reviews})</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {product.merchant}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Affiliate Disclosure */}
        <div className="text-center text-xs text-muted-foreground mt-8 pb-8">
          <p>
            Prices and availability are accurate as of the date/time indicated and are subject to change.
            Any price and availability information displayed on Amazon at the time of purchase will apply to the purchase of this product.
          </p>
        </div>
      </div>
    </div>
  )
}
