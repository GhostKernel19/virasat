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
      admin: string;
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
      livingAtlas: string;
      tagline: string;
      headline: string;
      description: string;
      ctaExploreMap: string;
      ctaEnterAtlas: string;
      ctaContributeRecord: string;
      bottomBarLeft: string;
      scrollToDiscover: string;
      introLabel: string;
      introTitle: string;
      introParagraph: string;
      addToAtlasAction: string;
    };
    explore: {
      title: string;
      subtitle: string;
      badge: string;
      status: string;
      selectedPlace: string;
      viewPlaceDossier: string;
      selectPlaceHint: string;
      loadingPlaces: string;
      noPlacesFound: string;
    };
    search: {
      title: string;
      subtitle: string;
      badge: string;
      placeholder: string;
      placesTitle: string;
      passagesTitle: string;
      noResults: string;
      noResultsSubtitle: string;
      loading: string;
      allTypes: string;
      typeFilterLabel: string;
      viewPlace: string;
      matchedIn: string;
      initialPrompt: string;
    };
    contribute: {
      title: string;
      subtitle: string;
      badge: string;
      cta: string;
      imageLabel: string;
      imageHint: string;
      titleLabel: string;
      titlePlaceholder: string;
      placeLabel: string;
      selectPlacePrompt: string;
      loadingPlaces: string;
      submitBtn: string;
      processingBtn: string;
      pipelineTitle: string;
      stageOcr: string;
      stageTranslate: string;
      stageTag: string;
      statusPending: string;
      statusRunning: string;
      statusDone: string;
      statusFailed: string;
      timeoutMessage: string;
      resultsTitle: string;
      devanagariHeader: string;
      translationHeader: string;
      tagsLabel: string;
      viewPlace: string;
      submitAnother: string;
    };
    place: {
      title: string;
      subtitle: string;
      badge: string;
      back: string;
    };
    admin: {
      title: string;
      subtitle: string;
      badge: string;
      filterInReview: string;
      filterPublished: string;
      filterAll: string;
      approveBtn: string;
      approvingBtn: string;
      approvedBadge: string;
      noItems: string;
      loading: string;
      viewPlace: string;
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
      admin: "05 / ADMIN",
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
      livingAtlas: "A LIVING HERITAGE ATLAS",
      tagline: "PLACES REMEMBER. RECORDS CONNECT.",
      headline: "From archival graveyard to living heritage map.",
      description: "A collaborative digital map documenting the stone, the stories, and the lived memories of India's historical landmarks.",
      ctaExploreMap: "Explore the map",
      ctaEnterAtlas: "Enter the atlas",
      ctaContributeRecord: "Contribute a record",
      bottomBarLeft: "VIRASAT / AN OPEN ATLAS OF PLACES, RECORDS AND MEMORY.",
      scrollToDiscover: "SCROLL TO DISCOVER",
      introLabel: "PLACES REMEMBER. RECORDS CONNECT.",
      introTitle: "From archival graveyard to living heritage map",
      introParagraph: "Follow a place from stone to story. Explore monuments, read records, and add what you know.",
      addToAtlasAction: "Add to the atlas →",
    },
    explore: {
      title: "Living Heritage Atlas — Spatial Discovery",
      subtitle: "Four places. Countless connections across western and southern India.",
      badge: "SPATIAL EXPLORER",
      status: "Explore interface ready. Map and split-view records will mount here.",
      selectedPlace: "Selected place",
      viewPlaceDossier: "View Place Dossier",
      selectPlaceHint: "Click a pin or card to inspect details",
      loadingPlaces: "Loading heritage atlas...",
      noPlacesFound: "No places match the selected filter.",
    },
    search: {
      title: "Archival Search & Spatial Index",
      subtitle: "Search verified inscriptions, survey reports, oral histories, and architectural sites.",
      badge: "ARCHIVE QUERY",
      placeholder: "Search monuments, dynasties, inscriptions, or regions...",
      placesTitle: "Places",
      passagesTitle: "Passages & Inscriptions",
      noResults: "No results found",
      noResultsSubtitle: "Try adjusting your keywords or clearing the type filter.",
      loading: "Searching archival records and monuments...",
      allTypes: "All Types",
      typeFilterLabel: "Filter by type:",
      viewPlace: "View Place",
      matchedIn: "Matched in",
      initialPrompt: "Enter a query above to search across monument summaries, Devanagari inscriptions, and translations.",
    },
    contribute: {
      title: "Add to the Living Heritage Atlas",
      subtitle: "Submit architectural field notes, family photographs, or undocumented oral histories.",
      badge: "COMMUNITY ARCHIVE",
      cta: "Submit Heritage Record",
      imageLabel: "Archival Image",
      imageHint: "Upload a scan or photo of an inscription, stepwell, temple, or fort (JPEG/PNG/WEBP).",
      titleLabel: "Record Title",
      titlePlaceholder: "e.g., Devanagari Stone Inscription at Stepwell Entrance",
      placeLabel: "Associated Heritage Place (Required)",
      selectPlacePrompt: "-- Select a place (Required) --",
      loadingPlaces: "Loading places from database...",
      submitBtn: "Submit Record to Pipeline",
      processingBtn: "Processing Pipeline...",
      pipelineTitle: "Pipeline Processing Status",
      stageOcr: "OCR Transcription (Devanagari)",
      stageTranslate: "Contextual Translation (English)",
      stageTag: "Taxonomy & Keyword Tagging",
      statusPending: "Pending",
      statusRunning: "Running",
      statusDone: "Completed",
      statusFailed: "Failed",
      timeoutMessage: "Processing timed out after 3 minutes. The pipeline may still be finishing in the background.",
      resultsTitle: "Processed Heritage Record",
      devanagariHeader: "Original Devanagari Text",
      translationHeader: "English Translation",
      tagsLabel: "Generated Tags",
      viewPlace: "View place",
      submitAnother: "Contribute Another Record",
    },
    place: {
      title: "Heritage Asset Record",
      subtitle: "Archival dossier, spatial coordinates, structural taxonomy, and source documents.",
      badge: "HERITAGE RECORD",
      back: "Back to Explore Atlas",
    },
    admin: {
      title: "Archive Moderation Queue",
      subtitle: "Review community-submitted records, inspect OCR transcripts, and approve them for publication.",
      badge: "ADMIN MODERATION",
      filterInReview: "In Review",
      filterPublished: "Published",
      filterAll: "All Records",
      approveBtn: "Approve for Publication",
      approvingBtn: "Approving...",
      approvedBadge: "Published",
      noItems: "No items matching this status.",
      loading: "Loading moderation items...",
      viewPlace: "View Place Dossier",
    },
  },
};
