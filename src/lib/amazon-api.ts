import { PAAPI_Item, PAAPI_SearchItemsResponse } from "./amazon-pa-api-types";

// UI Model (Simplified for the frontend)
export interface ProductUIModel {
  asin: string;
  title: string;
  price: {
    amount: number;
    currency: string;
    displayAmount: string;
  };
  image: string;
  url: string;
  rating?: number;
  reviewCount?: number;
  isPrime?: boolean;
  category: string;
  capacity: string;
  pricePerUnit?: string;
}

// Mock Data in Official PA-API 5.0 Structure
const MOCK_PAAPI_ITEMS: PAAPI_Item[] = [
  // External HDDs
  {
    ASIN: "B07VTWX8MN",
    DetailPageURL: "https://amazon.com/dp/B07VTWX8MN",
    Images: {
      Primary: {
        Small: { URL: "https://images.unsplash.com/photo-1531492746076-a61ce320bc7c?w=200&q=80", Height: 200, Width: 200 },
        Medium: { URL: "https://images.unsplash.com/photo-1531492746076-a61ce320bc7c?w=500&q=80", Height: 500, Width: 500 },
        Large: { URL: "https://images.unsplash.com/photo-1531492746076-a61ce320bc7c?w=1000&q=80", Height: 1000, Width: 1000 },
      }
    },
    ItemInfo: {
      Title: { DisplayValue: "Seagate Portable 2TB External Hard Drive Portable HDD", Label: "Title", Locale: "en_US" },
      Classifications: {
        ProductGroup: { DisplayValue: "External HDD", Label: "ProductGroup" },
        Binding: { DisplayValue: "Electronics", Label: "Binding" }
      },
      ProductInfo: {
        UnitCount: { DisplayValue: 2000, Label: "GB" } // Simulating capacity
      }
    },
    Offers: {
      Listings: [{
        Id: "L1",
        Price: { Amount: 61.99, Currency: "USD", DisplayAmount: "$61.99", PricePerUnit: 0.031 },
        ViolatesMAP: false
      }],
      Summaries: [{ LowestPrice: { Amount: 61.99, Currency: "USD", DisplayAmount: "$61.99" } }]
    }
  },
  {
    ASIN: "B07X41PWTY",
    DetailPageURL: "https://amazon.com/dp/B07X41PWTY",
    Images: {
      Primary: {
        Small: { URL: "https://images.unsplash.com/photo-1527434895431-98478d0d979c?w=200&q=80", Height: 200, Width: 200 },
        Medium: { URL: "https://images.unsplash.com/photo-1527434895431-98478d0d979c?w=500&q=80", Height: 500, Width: 500 },
        Large: { URL: "https://images.unsplash.com/photo-1527434895431-98478d0d979c?w=1000&q=80", Height: 1000, Width: 1000 },
      }
    },
    ItemInfo: {
      Title: { DisplayValue: "WD 5TB Elements Portable External Hard Drive HDD", Label: "Title", Locale: "en_US" },
      Classifications: {
        ProductGroup: { DisplayValue: "External HDD", Label: "ProductGroup" },
        Binding: { DisplayValue: "Electronics", Label: "Binding" }
      },
      ProductInfo: {
        UnitCount: { DisplayValue: 5000, Label: "GB" }
      }
    },
    Offers: {
      Listings: [{
        Id: "L2",
        Price: { Amount: 109.99, Currency: "USD", DisplayAmount: "$109.99", PricePerUnit: 0.022 },
        ViolatesMAP: false
      }],
      Summaries: [{ LowestPrice: { Amount: 109.99, Currency: "USD", DisplayAmount: "$109.99" } }]
    }
  },
  
  // Internal SSDs
  {
    ASIN: "B08V83JZH4",
    DetailPageURL: "https://amazon.com/dp/B08V83JZH4",
    Images: {
      Primary: {
        Small: { URL: "https://images.unsplash.com/photo-1628557044797-f21a177c37ec?w=200&q=80", Height: 200, Width: 200 },
        Medium: { URL: "https://images.unsplash.com/photo-1628557044797-f21a177c37ec?w=500&q=80", Height: 500, Width: 500 },
        Large: { URL: "https://images.unsplash.com/photo-1628557044797-f21a177c37ec?w=1000&q=80", Height: 1000, Width: 1000 },
      }
    },
    ItemInfo: {
      Title: { DisplayValue: "Samsung 980 PRO SSD 1TB PCIe Gen 4 NVMe M.2", Label: "Title", Locale: "en_US" },
      Classifications: {
        ProductGroup: { DisplayValue: "Internal SSD", Label: "ProductGroup" },
        Binding: { DisplayValue: "Electronics", Label: "Binding" }
      },
      ProductInfo: {
        UnitCount: { DisplayValue: 1000, Label: "GB" }
      }
    },
    Offers: {
      Listings: [{
        Id: "L3",
        Price: { Amount: 79.99, Currency: "USD", DisplayAmount: "$79.99", PricePerUnit: 0.080 },
        ViolatesMAP: false
      }],
      Summaries: [{ LowestPrice: { Amount: 79.99, Currency: "USD", DisplayAmount: "$79.99" } }]
    }
  },
  {
    ASIN: "B08QBMD6P4",
    DetailPageURL: "https://amazon.com/dp/B08QBMD6P4",
    Images: {
      Primary: {
        Small: { URL: "https://images.unsplash.com/photo-1558425283-6380a9145339?w=200&q=80", Height: 200, Width: 200 },
        Medium: { URL: "https://images.unsplash.com/photo-1558425283-6380a9145339?w=500&q=80", Height: 500, Width: 500 },
        Large: { URL: "https://images.unsplash.com/photo-1558425283-6380a9145339?w=1000&q=80", Height: 1000, Width: 1000 },
      }
    },
    ItemInfo: {
      Title: { DisplayValue: "Crucial MX500 2TB 3D NAND SATA 2.5 Inch Internal SSD", Label: "Title", Locale: "en_US" },
      Classifications: {
        ProductGroup: { DisplayValue: "Internal SSD", Label: "ProductGroup" },
        Binding: { DisplayValue: "Electronics", Label: "Binding" }
      },
      ProductInfo: {
        UnitCount: { DisplayValue: 2000, Label: "GB" }
      }
    },
    Offers: {
      Listings: [{
        Id: "L4",
        Price: { Amount: 107.99, Currency: "USD", DisplayAmount: "$107.99", PricePerUnit: 0.054 },
        ViolatesMAP: false
      }],
      Summaries: [{ LowestPrice: { Amount: 107.99, Currency: "USD", DisplayAmount: "$107.99" } }]
    }
  },

  // MicroSD
  {
    ASIN: "B09B1GXM16",
    DetailPageURL: "https://amazon.com/dp/B09B1GXM16",
    Images: {
      Primary: {
        Small: { URL: "https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=200&q=80", Height: 200, Width: 200 },
        Medium: { URL: "https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=500&q=80", Height: 500, Width: 500 },
        Large: { URL: "https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=1000&q=80", Height: 1000, Width: 1000 },
      }
    },
    ItemInfo: {
      Title: { DisplayValue: "SanDisk 128GB Extreme microSDXC UHS-I Memory Card", Label: "Title", Locale: "en_US" },
      Classifications: {
        ProductGroup: { DisplayValue: "MicroSD", Label: "ProductGroup" },
        Binding: { DisplayValue: "Electronics", Label: "Binding" }
      },
      ProductInfo: {
        UnitCount: { DisplayValue: 128, Label: "GB" }
      }
    },
    Offers: {
      Listings: [{
        Id: "L5",
        Price: { Amount: 17.49, Currency: "USD", DisplayAmount: "$17.49", PricePerUnit: 0.137 },
        ViolatesMAP: false
      }],
      Summaries: [{ LowestPrice: { Amount: 17.49, Currency: "USD", DisplayAmount: "$17.49" } }]
    }
  },

  // USB Drives
  {
    ASIN: "B015CH1NAQ",
    DetailPageURL: "https://amazon.com/dp/B015CH1NAQ",
    Images: {
      Primary: {
        Small: { URL: "https://images.unsplash.com/photo-1623949556303-b0d17d122d11?w=200&q=80", Height: 200, Width: 200 },
        Medium: { URL: "https://images.unsplash.com/photo-1623949556303-b0d17d122d11?w=500&q=80", Height: 500, Width: 500 },
        Large: { URL: "https://images.unsplash.com/photo-1623949556303-b0d17d122d11?w=1000&q=80", Height: 1000, Width: 1000 },
      }
    },
    ItemInfo: {
      Title: { DisplayValue: "Samsung FIT Plus 128GB - 400MB/s USB 3.1 Flash Drive", Label: "Title", Locale: "en_US" },
      Classifications: {
        ProductGroup: { DisplayValue: "USB Drive", Label: "ProductGroup" },
        Binding: { DisplayValue: "Electronics", Label: "Binding" }
      },
      ProductInfo: {
        UnitCount: { DisplayValue: 128, Label: "GB" }
      }
    },
    Offers: {
      Listings: [{
        Id: "L6",
        Price: { Amount: 19.99, Currency: "USD", DisplayAmount: "$19.99", PricePerUnit: 0.156 },
        ViolatesMAP: false
      }],
      Summaries: [{ LowestPrice: { Amount: 19.99, Currency: "USD", DisplayAmount: "$19.99" } }]
    }
  },

  // NAS
  {
    ASIN: "B087Z34F3R",
    DetailPageURL: "https://amazon.com/dp/B087Z34F3R",
    Images: {
      Primary: {
        Small: { URL: "https://images.unsplash.com/photo-1558425283-6380a9145339?w=200&q=80", Height: 200, Width: 200 },
        Medium: { URL: "https://images.unsplash.com/photo-1558425283-6380a9145339?w=500&q=80", Height: 500, Width: 500 },
        Large: { URL: "https://images.unsplash.com/photo-1558425283-6380a9145339?w=1000&q=80", Height: 1000, Width: 1000 },
      }
    },
    ItemInfo: {
      Title: { DisplayValue: "Synology 2-Bay DiskStation DS220+ (Diskless)", Label: "Title", Locale: "en_US" },
      Classifications: {
        ProductGroup: { DisplayValue: "NAS", Label: "ProductGroup" },
        Binding: { DisplayValue: "Electronics", Label: "Binding" }
      },
      ProductInfo: {
        UnitCount: { DisplayValue: 0, Label: "TB" }
      }
    },
    Offers: {
      Listings: [{
        Id: "L7",
        Price: { Amount: 299.99, Currency: "USD", DisplayAmount: "$299.99" },
        ViolatesMAP: false
      }],
      Summaries: [{ LowestPrice: { Amount: 299.99, Currency: "USD", DisplayAmount: "$299.99" } }]
    }
  }
];

export class MockAmazonAPI {
  /**
   * Adapts a raw PA-API 5.0 item to our UI model.
   */
  private static adapter(item: PAAPI_Item): ProductUIModel {
    const price = item.Offers?.Summaries[0]?.LowestPrice || { Amount: 0, Currency: "USD", DisplayAmount: "$0.00" };
    const listing = item.Offers?.Listings[0];
    
    // Calculate capacity string
    const unitCount = item.ItemInfo.ProductInfo?.UnitCount;
    const capacity = unitCount ? `${unitCount.DisplayValue}${unitCount.Label}` : "N/A";

    // Format price per unit if available
    const pricePerUnit = listing?.Price.PricePerUnit 
      ? `$${listing.Price.PricePerUnit.toFixed(3)} / ${unitCount?.Label || 'Unit'}`
      : undefined;

    return {
      asin: item.ASIN,
      title: item.ItemInfo.Title.DisplayValue,
      price: {
        amount: price.Amount,
        currency: price.Currency,
        displayAmount: price.DisplayAmount
      },
      image: item.Images.Primary.Medium.URL,
      url: item.DetailPageURL,
      rating: 4.5, // Mock rating as PA-API doesn't always provide this directly in SearchItems without extra params
      reviewCount: 100, // Mock review count
      isPrime: true, // Mock Prime status
      category: item.ItemInfo.Classifications?.ProductGroup.DisplayValue || "Unknown",
      capacity: capacity,
      pricePerUnit: pricePerUnit
    };
  }

  /**
   * Simulates searching for products on Amazon using PA-API 5.0 structure.
   * Returns the UI model for easy consumption.
   */
  static async searchProducts(query: string): Promise<ProductUIModel[]> {
    console.log(`[MockAmazonAPI] Searching for: "${query}"`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    let results = MOCK_PAAPI_ITEMS;

    if (query && query !== "trending") {
      const lowerQuery = query.toLowerCase();
      results = MOCK_PAAPI_ITEMS.filter(p => 
        p.ItemInfo.Title.DisplayValue.toLowerCase().includes(lowerQuery) || 
        p.ASIN.toLowerCase().includes(lowerQuery) ||
        p.ItemInfo.Classifications?.ProductGroup.DisplayValue.toLowerCase().includes(lowerQuery)
      );
    }

    // Map through the adapter
    return results.map(this.adapter);
  }

  /**
   * Simulates fetching a single product by ASIN.
   */
  static async getProduct(asin: string): Promise<ProductUIModel | null> {
    console.log(`[MockAmazonAPI] Fetching product: ${asin}`);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const item = MOCK_PAAPI_ITEMS.find(p => p.ASIN === asin);
    return item ? this.adapter(item) : null;
  }
}
