export interface Place {
  id: string;
  slug: string;
  name: string;
  marathiName: string;
  region: string;
  state: string;
  lat: number;
  lng: number;
  period: string;
  category: string;
  summary: string;
  imageUrl?: string | null;
  image_url?: string | null;
  image_credit?: string | null;
  imageCredit?: string | null;
  hasOcr: boolean;
  recordsCount: number;
  isIllustrative: boolean;
}

export type FilterCategory = "all" | "ocr" | "stepwells" | "forts";

