export interface TranslationDictionary {
  brand: {
    logo: string;
    labelTop: string;
    labelBottom: string;
    sublabel: string;
  };
  nav: {
    explore: string;
    search: string;
    contribute: string;
    saved: string;
  };
  footer: {
    brandPrefix: string;
    tagline: string;
    sourcesAndAttribution: string;
    pageCodes: {
      home: string;
      explore: string;
      search: string;
      contribute: string;
      place: string;
    };
  };
  common: {
    hasOcr: string;
    records: string;
    recordSingular: string;
    illustrative: string;
    recommended: string;
    placesInCollection: string;
    placesMapped: string;
    linkedRecords: string;
    addToAtlas: string;
    all: string;
    stepwells: string;
    forts: string;
    viewDetails: string;
    savedCount: string;
    quoteBanner: string;
  };
  routes: {
    home: {
      title: string;
      subtitle: string;
      badge: string;
      ctaExplore: string;
      ctaContribute: string;
    };
    explore: {
      title: string;
      subtitle: string;
      badge: string;
      status: string;
    };
    search: {
      title: string;
      subtitle: string;
      badge: string;
      placeholder: string;
    };
    contribute: {
      title: string;
      subtitle: string;
      badge: string;
      cta: string;
    };
    place: {
      title: string;
      subtitle: string;
      badge: string;
      back: string;
    };
  };
}

export const en: TranslationDictionary = {
  brand: {
    logo: "विरासत",
    labelTop: "A LIVING",
    labelBottom: "HERITAGE ATLAS",
    sublabel: "A LIVING HERITAGE ATLAS",
  },
  nav: {
    explore: "Explore",
    search: "Search",
    contribute: "Contribute",
    saved: "Saved",
  },
  footer: {
    brandPrefix: "Virasat",
    tagline: "An open atlas of places, records and memory.",
    sourcesAndAttribution: "Sources & attribution",
    pageCodes: {
      home: "00 / INDEX",
      explore: "01 / EXPLORE",
      search: "02 / SEARCH",
      contribute: "03 / CONTRIBUTE",
      place: "04 / PLACE",
    },
  },
  common: {
    hasOcr: "Has OCR",
    records: "records",
    recordSingular: "record",
    illustrative: "illustrative",
    recommended: "Recommended",
    placesInCollection: "places in this collection",
    placesMapped: "places mapped",
    linkedRecords: "linked records",
    addToAtlas: "Add to the atlas",
    all: "All",
    stepwells: "Stepwells",
    forts: "Forts",
    viewDetails: "View Details",
    savedCount: "Saved 03",
    quoteBanner: "A forgotten inscription. A family photograph. A place worth remembering.",
  },
  routes: {
    home: {
      title: "From archival graveyard to living heritage map",
      subtitle: "Follow a place from stone to story. Explore monuments, read records, and add what you know.",
      badge: "PLACES REMEMBER. RECORDS CONNECT.",
      ctaExplore: "Launch Explore Atlas",
      ctaContribute: "Contribute Record",
    },
    explore: {
      title: "Living Heritage Atlas — Spatial Discovery",
      subtitle: "Four places. Countless connections across western and southern India.",
      badge: "SPATIAL EXPLORER",
      status: "Explore interface ready. Map and split-view records will mount here.",
    },
    search: {
      title: "Archival Search & Spatial Index",
      subtitle: "Search verified inscriptions, survey reports, oral histories, and architectural sites.",
      badge: "ARCHIVE QUERY",
      placeholder: "Search monuments, dynasties, inscriptions, or regions...",
    },
    contribute: {
      title: "Add to the Living Heritage Atlas",
      subtitle: "Submit architectural field notes, family photographs, or undocumented oral histories.",
      badge: "COMMUNITY ARCHIVE",
      cta: "Submit Heritage Record",
    },
    place: {
      title: "Heritage Asset Record",
      subtitle: "Archival dossier, spatial coordinates, structural taxonomy, and source documents.",
      badge: "HERITAGE RECORD",
      back: "Back to Explore Atlas",
    },
  },
};
