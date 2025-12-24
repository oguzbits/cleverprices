export interface PAAPI_Price {
  Amount: number;
  Currency: string;
  DisplayAmount: string;
  PricePerUnit?: number; // Note: Real API might not have this exact field, but we'll include it for our mock data needs or assume it comes from somewhere
}

export interface PAAPI_OfferListing {
  Id: string;
  Price: PAAPI_Price;
  ViolatesMAP: boolean;
}

export interface PAAPI_Offer {
  Listings: PAAPI_OfferListing[];
  Condition: {
    Value: string;
  };
}

export interface PAAPI_ImageSize {
  URL: string;
  Height: number;
  Width: number;
}

export interface PAAPI_Images {
  Primary: {
    Small: PAAPI_ImageSize;
    Medium: PAAPI_ImageSize;
    Large: PAAPI_ImageSize;
  };
  Variants?: {
    Small: PAAPI_ImageSize;
    Medium: PAAPI_ImageSize;
    Large: PAAPI_ImageSize;
  }[];
}

export interface PAAPI_ItemInfo {
  Title: {
    DisplayValue: string;
    Label: string;
    Locale: string;
  };
  Features?: {
    DisplayValues: string[];
    Label: string;
    Locale: string;
  };
  ProductInfo?: {
    Color?: {
      DisplayValue: string;
    };
    Size?: {
      DisplayValue: string;
    };
    UnitCount?: {
      DisplayValue: number;
      Label: string; // e.g. "Count", "Ounce"
    };
  };
  Classifications?: {
    Binding: {
      DisplayValue: string;
      Label: string;
    };
    ProductGroup: {
      DisplayValue: string;
      Label: string;
    };
  };
}

export interface PAAPI_Item {
  ASIN: string;
  DetailPageURL: string;
  Images: PAAPI_Images;
  ItemInfo: PAAPI_ItemInfo;
  Offers?: {
    Listings: PAAPI_OfferListing[];
    Summaries: {
      LowestPrice: PAAPI_Price;
    }[];
  };
}

export interface PAAPI_SearchResult {
  TotalResultCount: number;
  SearchResult: {
    Items: PAAPI_Item[];
  };
}

export interface PAAPI_SearchItemsResponse {
  SearchResult: {
    Items: PAAPI_Item[];
    TotalResultCount: number;
    SearchURL: string;
  };
}
