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
  imageUrl: string;
  hasOcr: boolean;
  recordsCount: number;
  isIllustrative: boolean;
}

export type FilterCategory = "all" | "ocr" | "stepwells" | "forts";

