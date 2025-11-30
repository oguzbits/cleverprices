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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Filter,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Menu
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types
type Product = {
  id: number
  name: string
  price: number
  capacity: number // in GB
  capacityUnit: 'GB' | 'TB'
  pricePerTB: number
  warranty: string
  formFactor: string
  technology: 'HDD' | 'SSD' | 'SAS'
  condition: 'New' | 'Used' | 'Renewed'
  affiliateLink: string
  brand: string
}

// Mock Data Generator
const generateProducts = (count: number): Product[] => {
  const formFactors = ["Internal 3.5\"", "Internal 2.5\"", "External 3.5\"", "External 2.5\"", "M.2 NVMe", "M.2 SATA"]
  const technologies = ["HDD", "SSD", "SAS"] as const
  const conditions = ["New", "Used", "Renewed"] as const
  const warranties = ["1 year", "2 years", "3 years", "5 years", "Lifetime"]
  const brands = ["Seagate", "Western Digital", "Toshiba", "Samsung", "Crucial", "SanDisk", "Kingston"]

  return Array.from({ length: count }).map((_, i) => {
    const isTB = Math.random() > 0.3
    const capacityValue = isTB ? Math.floor(Math.random() * 18) + 1 : [256, 512, 1000][Math.floor(Math.random() * 3)]
    const capacityGB = isTB ? capacityValue * 1000 : capacityValue

    // Realistic pricing logic
    const basePricePerTB = Math.random() * 15 + 10 // $10-$25 per TB
    const price = (capacityGB / 1000) * basePricePerTB * (Math.random() * 0.5 + 0.8)

    return {
      id: i,
      name: `${brands[Math.floor(Math.random() * brands.length)]} ${capacityValue}${isTB ? 'TB' : 'GB'} ${formFactors[Math.floor(Math.random() * formFactors.length)]}`,
      price: parseFloat(price.toFixed(2)),
      capacity: capacityGB,
      capacityUnit: isTB ? 'TB' : 'GB',
      pricePerTB: parseFloat((price / (capacityGB / 1000)).toFixed(3)),
      warranty: warranties[Math.floor(Math.random() * warranties.length)],
      formFactor: formFactors[Math.floor(Math.random() * formFactors.length)],
      technology: technologies[Math.floor(Math.random() * technologies.length)],
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      affiliateLink: `https://www.amazon.com/dp/B0${Math.random().toString(36).substring(7).toUpperCase()}?tag=bestprices-20`,
      brand: brands[Math.floor(Math.random() * brands.length)],
    }
  })
}

const allProducts = generateProducts(100)

type SortConfig = {
  key: keyof Product
  direction: 'asc' | 'desc'
}

export default function SubcategoryPage() {
  const params = useParams()
  const slug = params.slug as string

  // State
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: 'pricePerTB', direction: 'asc' })

  // Filters
  const [selectedConditions, setSelectedConditions] = React.useState<string[]>(['New', 'Used', 'Renewed'])
  const [selectedTechnologies, setSelectedTechnologies] = React.useState<string[]>(['HDD', 'SSD', 'SAS'])
  const [selectedFormFactors, setSelectedFormFactors] = React.useState<string[]>([])
  const [minCapacity, setMinCapacity] = React.useState("")
  const [maxCapacity, setMaxCapacity] = React.useState("")

  // Filter Logic
  // Filter Logic
  let filteredProducts = [...allProducts]

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  if (selectedConditions.length > 0) {
    filteredProducts = filteredProducts.filter(p => selectedConditions.includes(p.condition))
  }

  if (selectedTechnologies.length > 0) {
    filteredProducts = filteredProducts.filter(p => selectedTechnologies.includes(p.technology))
  }

  if (selectedFormFactors.length > 0) {
    filteredProducts = filteredProducts.filter(p => selectedFormFactors.includes(p.formFactor))
  }

  if (minCapacity) {
    const min = parseFloat(minCapacity)
    if (!isNaN(min)) filteredProducts = filteredProducts.filter(p => (p.capacity / 1000) >= min)
  }

  if (maxCapacity) {
    const max = parseFloat(maxCapacity)
    if (!isNaN(max)) filteredProducts = filteredProducts.filter(p => (p.capacity / 1000) <= max)
  }

  // Sorting
  filteredProducts.sort((a, b) => {
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    }

    if (String(aValue) < String(bValue)) return sortConfig.direction === 'asc' ? -1 : 1
    if (String(aValue) > String(bValue)) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key: keyof Product) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const toggleFilter = (set: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    set(current =>
      current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value]
    )
  }

  const getSortIcon = (key: keyof Product) => {
    if (sortConfig.key !== key) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="ml-1 h-3 w-3" />
      : <ChevronDown className="ml-1 h-3 w-3" />
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Disk Price Comparison</h1>
            <p className="text-muted-foreground text-sm">
              Showing {filteredProducts.length} disks. Updated hourly.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search disks..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search disks"
              />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open filters">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] px-4 pb-4 pt-12">
                <SheetTitle className="sr-only">Filters</SheetTitle>
                <div className="h-full overflow-y-auto">
                  <FilterPanel 
                    selectedConditions={selectedConditions}
                    setSelectedConditions={setSelectedConditions}
                    selectedTechnologies={selectedTechnologies}
                    setSelectedTechnologies={setSelectedTechnologies}
                    selectedFormFactors={selectedFormFactors}
                    setSelectedFormFactors={setSelectedFormFactors}
                    minCapacity={minCapacity}
                    setMinCapacity={setMinCapacity}
                    maxCapacity={maxCapacity}
                    setMaxCapacity={setMaxCapacity}
                    toggleFilter={toggleFilter}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div>
              <FilterPanel 
                selectedConditions={selectedConditions}
                setSelectedConditions={setSelectedConditions}
                selectedTechnologies={selectedTechnologies}
                setSelectedTechnologies={setSelectedTechnologies}
                selectedFormFactors={selectedFormFactors}
                setSelectedFormFactors={setSelectedFormFactors}
                minCapacity={minCapacity}
                setMinCapacity={setMinCapacity}
                maxCapacity={maxCapacity}
                setMaxCapacity={setMaxCapacity}
                toggleFilter={toggleFilter}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* ... (keep table content) */}
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset" 
                      onClick={() => handleSort('pricePerTB')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSort('pricePerTB')
                        }
                      }}
                      tabIndex={0}
                      aria-sort={sortConfig.key === 'pricePerTB' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      role="columnheader"
                    >
                      <div className="flex items-center">Price/TB {getSortIcon('pricePerTB')}</div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset" 
                      onClick={() => handleSort('price')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSort('price')
                        }
                      }}
                      tabIndex={0}
                      aria-sort={sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      role="columnheader"
                    >
                      <div className="flex items-center">Price {getSortIcon('price')}</div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset" 
                      onClick={() => handleSort('capacity')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSort('capacity')
                        }
                      }}
                      tabIndex={0}
                      aria-sort={sortConfig.key === 'capacity' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      role="columnheader"
                    >
                      <div className="flex items-center">Capacity {getSortIcon('capacity')}</div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Warranty</TableHead>
                    <TableHead className="hidden sm:table-cell">Form Factor</TableHead>
                    <TableHead className="hidden sm:table-cell">Tech</TableHead>
                    <TableHead className="hidden sm:table-cell">Condition</TableHead>
                    <TableHead>Affiliate Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="group">
                      <TableCell className="font-medium">
                        ${product.pricePerTB.toFixed(3)}
                      </TableCell>
                      <TableCell>
                        ${product.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {product.capacityUnit === 'TB' ? (product.capacity / 1000).toFixed(1) : product.capacity} {product.capacityUnit}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {product.warranty}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {product.formFactor}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {product.technology}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={product.condition === 'New' ? 'default' : 'secondary'} className="text-xs font-normal">
                          {product.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={product.affiliateLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary underline text-sm line-clamp-2 block"
                        >
                          {product.name}
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Prices and availability are subject to change.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FilterPanelProps {
  selectedConditions: string[]
  setSelectedConditions: React.Dispatch<React.SetStateAction<string[]>>
  selectedTechnologies: string[]
  setSelectedTechnologies: React.Dispatch<React.SetStateAction<string[]>>
  selectedFormFactors: string[]
  setSelectedFormFactors: React.Dispatch<React.SetStateAction<string[]>>
  minCapacity: string
  setMinCapacity: React.Dispatch<React.SetStateAction<string>>
  maxCapacity: string
  setMaxCapacity: React.Dispatch<React.SetStateAction<string>>
  toggleFilter: (set: React.Dispatch<React.SetStateAction<string[]>>, value: string) => void
}

function FilterPanel({
  selectedConditions,
  setSelectedConditions,
  selectedTechnologies,
  setSelectedTechnologies,
  selectedFormFactors,
  setSelectedFormFactors,
  minCapacity,
  setMinCapacity,
  maxCapacity,
  setMaxCapacity,
  toggleFilter
}: FilterPanelProps) {
  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <h2 className="sr-only">Filters</h2>
        <Accordion type="multiple" defaultValue={["condition", "capacity", "technology", "form-factor"]} className="w-full">
          <AccordionItem value="condition" className="border-b">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline pb-3 pt-0">Condition</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 pt-1 pb-3">
                {["New", "Used", "Renewed"].map((condition) => (
                  <div key={condition} className="flex items-center space-x-3">
                    <Checkbox
                      id={`condition-${condition}`}
                      checked={selectedConditions.includes(condition)}
                      onCheckedChange={() => toggleFilter(setSelectedConditions, condition)}
                    />
                    <Label htmlFor={`condition-${condition}`} className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">{condition}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="capacity" className="border-b">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Capacity (TB)</AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center gap-2 pt-1 pb-3">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minCapacity}
                    onChange={(e) => setMinCapacity(e.target.value)}
                    className="w-full pr-8"
                    aria-label="Minimum capacity in TB"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">TB</span>
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full pr-8"
                    aria-label="Maximum capacity in TB"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">TB</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="technology" className="border-b">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Technology</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 pt-1 pb-3">
                {["HDD", "SSD", "SAS"].map((tech) => (
                  <div key={tech} className="flex items-center space-x-3">
                    <Checkbox
                      id={`tech-${tech}`}
                      checked={selectedTechnologies.includes(tech)}
                      onCheckedChange={() => toggleFilter(setSelectedTechnologies, tech)}
                    />
                    <Label htmlFor={`tech-${tech}`} className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">{tech}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="form-factor" className="border-none">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Form Factor</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 pt-1 pb-3">
                {["Internal 3.5\"", "Internal 2.5\"", "External 3.5\"", "External 2.5\"", "M.2 NVMe", "M.2 SATA"].map((ff) => (
                  <div key={ff} className="flex items-center space-x-3">
                    <Checkbox
                      id={`ff-${ff}`}
                      checked={selectedFormFactors.includes(ff)}
                      onCheckedChange={() => toggleFilter(setSelectedFormFactors, ff)}
                    />
                    <Label htmlFor={`ff-${ff}`} className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">{ff}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
