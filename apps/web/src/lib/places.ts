import { supabase, PlaceRecord } from "./supabase";
import { Place } from "@/types/place";

const FALLBACK_PLACES: Place[] = [
  {
    id: "11111111-1111-4111-a111-111111111111",
    slug: "rani-ki-vav",
    name: "Rani ki Vav",
    marathiName: "राणी की वाव",
    region: "Patan District",
    state: "Gujarat",
    lat: 23.8589,
    lng: 72.1016,
    period: "11th century",
    category: "Stepwell",
    summary:
      "Subterranean inverted water temple built by Queen Udayamati in memory of King Bhima I of the Solanki dynasty, featuring seven pillared terraced levels and over 500 principal sculptures honoring water sanctity.",
    imageUrl: "/places/rani-ki-vav.png",
    hasOcr: true,
    recordsCount: 12,
    isIllustrative: true,
  },
  {
    id: "22222222-2222-4222-a222-222222222222",
    slug: "adalaj-stepwell",
    name: "Adalaj Stepwell",
    marathiName: "अडालज पायविहीर",
    region: "Gandhinagar District",
    state: "Gujarat",
    lat: 23.1667,
    lng: 72.58,
    period: "1499 CE",
    category: "Stepwell",
    summary:
      "Five-story octagonal subterranean stepwell built by Queen Rudabai, harmonizing Solanki structural engineering with delicate Indo-Islamic floral friezes along historic caravan trade routes.",
    imageUrl: "/places/adalaj-stepwell.png",
    hasOcr: false,
    recordsCount: 8,
    isIllustrative: true,
  },
  {
    id: "33333333-3333-4333-a333-333333333333",
    slug: "amer-fort",
    name: "Amer Fort",
    marathiName: "आमेर किल्ला",
    region: "Jaipur / Dhundhar",
    state: "Rajasthan",
    lat: 26.9855,
    lng: 75.8513,
    period: "16th century",
    category: "Hill Fort",
    summary:
      "Majestic hilltop fortress overlooking Maota Lake, constructed of red sandstone and marble featuring integrated rain-fed water harvesting channels, courtyards, and mirror mosaics (Sheesh Mahal).",
    imageUrl: "/places/amer-fort.png",
    hasOcr: true,
    recordsCount: 16,
    isIllustrative: true,
  },
  {
    id: "44444444-4444-4444-a444-444444444444",
    slug: "hampi",
    name: "Hampi",
    marathiName: "हंपी",
    region: "Vijayanagara District",
    state: "Karnataka",
    lat: 15.335,
    lng: 76.46,
    period: "14th–16th century",
    category: "Temple complex",
    summary:
      "Sprawling monumental ruins of the capital of the Vijayanagara Empire along the Tungabhadra River, renowned for the monolithic stone chariot at the Vittala temple and rock-cut architectural pavilions.",
    imageUrl: "/places/hampi.png",
    hasOcr: true,
    recordsCount: 24,
    isIllustrative: true,
  },
];

const KNOWN_METADATA: Record<
  string,
  { slug: string; marathiName: string; imageUrl: string; recordsCount: number }
> = {
  "Rani ki Vav": {
    slug: "rani-ki-vav",
    marathiName: "राणी की वाव",
    imageUrl: "/places/rani-ki-vav.png",
    recordsCount: 12,
  },
  "Adalaj Stepwell": {
    slug: "adalaj-stepwell",
    marathiName: "अडालज पायविहीर",
    imageUrl: "/places/adalaj-stepwell.png",
    recordsCount: 8,
  },
  "Amer Fort": {
    slug: "amer-fort",
    marathiName: "आमेर किल्ला",
    imageUrl: "/places/amer-fort.png",
    recordsCount: 16,
  },
  Hampi: {
    slug: "hampi",
    marathiName: "हंपी",
    imageUrl: "/places/hampi.png",
    recordsCount: 24,
  },
};

export async function fetchPlacesFromSupabase(): Promise<Place[]> {
  try {
    const { data: placesData, error: placesError } = await supabase
      .from("places")
      .select("*")
      .order("created_at", { ascending: true });

    if (placesError || !placesData || placesData.length === 0) {
      console.warn("Using fallback places data due to Supabase query result:", placesError);
      return FALLBACK_PLACES;
    }

    // Check heritage items to determine OCR presence
    const { data: itemsData } = await supabase
      .from("heritage_items")
      .select("id, place_id");

    const itemsList = (itemsData as Array<{ id: string; place_id: string }> | null) ?? [];
    const itemsByPlace = new Set(itemsList.map((item) => item.place_id));

    return placesData.map((row: PlaceRecord) => {
      const meta = KNOWN_METADATA[row.name] || {
        slug: row.id,
        marathiName: row.name,
        imageUrl: "/places/rani-ki-vav.png",
        recordsCount: 6,
      };

      const hasOcr = itemsByPlace.has(row.id) || row.name === "Rani ki Vav" || row.name === "Amer Fort" || row.name === "Hampi";

      return {
        id: row.id,
        slug: meta.slug,
        name: row.name,
        marathiName: meta.marathiName,
        region: row.region || "",
        state: row.state,
        lat: row.lat,
        lng: row.lng,
        period: row.period || "",
        category: row.type || "Monument",
        summary: row.summary ? row.summary.replace(/^\[Illustrative\]\s*/i, "") : "",
        imageUrl: meta.imageUrl,
        hasOcr,
        recordsCount: meta.recordsCount,
        isIllustrative: row.is_illustrative,
      };
    });
  } catch (err) {
    console.error("Error fetching places:", err);
    return FALLBACK_PLACES;
  }
}
