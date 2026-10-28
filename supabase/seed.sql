-- =============================================================================
-- Virasat (विरासत) — Supabase Seed Data
-- Track: HC26-CULT01 (A Living Heritage Atlas)
--
-- NOTE PER AGENTS.MD:
-- All records seeded below are prototype/synthetic mock records and are
-- explicitly labeled as "[Illustrative]" in titles, descriptions, and the
-- is_illustrative boolean column.
-- =============================================================================

-- Clear existing data if re-seeding
truncate table processing_jobs, item_tags, tags, translations, ocr_texts, media, heritage_items, places restart identity cascade;

-- -----------------------------------------------------------------------------
-- 1. Places (4 Verified Heritage Sites with Real Spatial Coordinates)
-- -----------------------------------------------------------------------------

-- Rani ki Vav (Patan, Gujarat) — 23.8589° N, 72.1016° E
insert into places (
  id,
  name,
  region,
  state,
  lat,
  lng,
  geom,
  period,
  type,
  summary,
  is_illustrative
) values (
  '11111111-1111-4111-a111-111111111111',
  'Rani ki Vav',
  'Patan District',
  'Gujarat',
  23.8589,
  72.1016,
  st_setsrid(st_makepoint(72.1016, 23.8589), 4326)::geography,
  '11th century',
  'Stepwell',
  '[Illustrative] Subterranean inverted water temple built by Queen Udayamati in memory of King Bhima I of the Solanki dynasty, featuring seven pillared terraced levels and over 500 principal sculptures honoring water sanctity.',
  true
);

-- Adalaj Stepwell (Gandhinagar / Ahmedabad, Gujarat) — 23.1667° N, 72.5800° E
insert into places (
  id,
  name,
  region,
  state,
  lat,
  lng,
  geom,
  period,
  type,
  summary,
  is_illustrative
) values (
  '22222222-2222-4222-a222-222222222222',
  'Adalaj Stepwell',
  'Gandhinagar District',
  'Gujarat',
  23.1667,
  72.5800,
  st_setsrid(st_makepoint(72.5800, 23.1667), 4326)::geography,
  '1499 CE',
  'Stepwell',
  '[Illustrative] Five-story octagonal subterranean stepwell built by Queen Rudabai, harmonizing Solanki structural engineering with delicate Indo-Islamic floral friezes along historic caravan trade routes.',
  true
);

-- Amer Fort (Jaipur, Rajasthan) — 26.9855° N, 75.8513° E
insert into places (
  id,
  name,
  region,
  state,
  lat,
  lng,
  geom,
  period,
  type,
  summary,
  is_illustrative
) values (
  '33333333-3333-4333-a333-333333333333',
  'Amer Fort',
  'Jaipur / Dhundhar',
  'Rajasthan',
  26.9855,
  75.8513,
  st_setsrid(st_makepoint(75.8513, 26.9855), 4326)::geography,
  '16th century',
  'Hill Fort',
  '[Illustrative] Majestic hilltop fortress overlooking Maota Lake, constructed of red sandstone and marble featuring integrated rain-fed water harvesting channels, courtyards, and mirror mosaics (Sheesh Mahal).',
  true
);

-- Hampi (Vijayanagara, Karnataka) — 15.3350° N, 76.4600° E
insert into places (
  id,
  name,
  region,
  state,
  lat,
  lng,
  geom,
  period,
  type,
  summary,
  is_illustrative
) values (
  '44444444-4444-4444-a444-444444444444',
  'Hampi',
  'Vijayanagara District',
  'Karnataka',
  15.3350,
  76.4600,
  st_setsrid(st_makepoint(76.4600, 15.3350), 4326)::geography,
  '14th–16th century',
  'Temple complex',
  '[Illustrative] Sprawling monumental ruins of the capital of the Vijayanagara Empire along the Tungabhadra River, renowned for the monolithic stone chariot at the Vittala temple and rock-cut architectural pavilions.',
  true
);

-- -----------------------------------------------------------------------------
-- 2. Tags (Thematic Taxonomies)
-- -----------------------------------------------------------------------------
insert into tags (id, name) values
  ('a0000001-0000-0000-0000-000000000001', 'stepwell'),
  ('a0000001-0000-0000-0000-000000000002', 'solanki-dynasty'),
  ('a0000001-0000-0000-0000-000000000003', 'water-heritage'),
  ('a0000001-0000-0000-0000-000000000004', 'epigraphy-inscription'),
  ('a0000001-0000-0000-0000-000000000005', 'fortress-architecture'),
  ('a0000001-0000-0000-0000-000000000006', 'rajput-heritage'),
  ('a0000001-0000-0000-0000-000000000007', 'vijayanagara-empire'),
  ('a0000001-0000-0000-0000-000000000008', 'temple-architecture');

-- -----------------------------------------------------------------------------
-- 3. Illustrative Marathi OCR Record 1: Rani ki Vav (Patan, Gujarat)
-- -----------------------------------------------------------------------------
insert into heritage_items (
  id,
  place_id,
  title,
  status,
  language,
  contributor,
  is_illustrative
) values (
  'b1111111-1111-1111-1111-111111111111',
  '11111111-1111-4111-a111-111111111111',
  '[Illustrative] पाटण येथील राणी की वाव विहिरीचा ऐतिहासिक शिलालेख व वास्तुवर्णन',
  'verified',
  'mr',
  'Virasat Historical Survey Archive [Illustrative]',
  true
);

insert into item_tags (item_id, tag_id) values
  ('b1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001'),
  ('b1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000002'),
  ('b1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000003'),
  ('b1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000004');

insert into media (
  id,
  item_id,
  url,
  caption,
  mime_type,
  is_illustrative
) values (
  'c1111111-1111-1111-1111-111111111111',
  'b1111111-1111-1111-1111-111111111111',
  'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&q=80',
  '[Illustrative] Subterranean stone inscription scan documenting the foundation chronicle of Rani ki Vav at Patan',
  'image/jpeg',
  true
);

insert into ocr_texts (
  id,
  media_id,
  original_text,
  language,
  confidence,
  lines,
  is_illustrative
) values (
  'd1111111-1111-1111-1111-111111111111',
  'c1111111-1111-1111-1111-111111111111',
  E'श्री सोलंकी कुलभूषण भीमदेव प्रथम यांच्या स्मरणार्थ राणी उदयमती यांनी बांधलेली ही भव्य पायविहीर.\nजलदेवता आणि भगवान विष्णूच्या दशावतारांच्या उत्कृष्ट मूर्तींनी सात मजली दालने सुशोभित केली आहेत.\nसरस्वती नदीच्या खोऱ्यातील जलसंधारण आणि स्थापत्यकलेचा हा अनुपमेय वारसा मानला जातो.',
  'mr',
  0.9675,
  '[
    {
      "text": "श्री सोलंकी कुलभूषण भीमदेव प्रथम यांच्या स्मरणार्थ राणी उदयमती यांनी बांधलेली ही भव्य पायविहीर.",
      "confidence": 0.9750,
      "bbox": [0.082, 0.115, 0.915, 0.178]
    },
    {
      "text": "जलदेवता आणि भगवान विष्णूच्या दशावतारांच्या उत्कृष्ट मूर्तींनी सात मजली दालने सुशोभित केली आहेत.",
      "confidence": 0.9620,
      "bbox": [0.084, 0.201, 0.898, 0.264]
    },
    {
      "text": "सरस्वती नदीच्या खोऱ्यातील जलसंधारण आणि स्थापत्यकलेचा हा अनुपमेय वारसा मानला जातो.",
      "confidence": 0.9540,
      "bbox": [0.081, 0.288, 0.885, 0.352]
    }
  ]'::jsonb,
  true
);

insert into translations (
  id,
  ocr_id,
  language,
  text,
  model,
  is_illustrative
) values (
  'e1111111-1111-1111-1111-111111111111',
  'd1111111-1111-1111-1111-111111111111',
  'en',
  '[Illustrative] This grand stepwell was commissioned by Queen Udayamati in loving memory of Bhima I, ornament of the Solanki dynasty. The seven subterranean pavilions are adorned with exquisite sculptures of water deities and the ten incarnations (Dashavatara) of Lord Vishnu. It stands as an incomparable legacy of water conservation and architecture in the Saraswati river basin.',
  'bhashini-nllb-200-3.3b [Illustrative]',
  true
);

insert into processing_jobs (
  item_id,
  stage,
  status,
  started_at,
  finished_at
) values (
  'b1111111-1111-1111-1111-111111111111',
  'translation',
  'completed',
  now() - interval '2 hours',
  now() - interval '1 hour 58 minutes'
);

-- -----------------------------------------------------------------------------
-- 4. Illustrative Marathi OCR Record 2: Amer Fort (Jaipur, Rajasthan)
-- -----------------------------------------------------------------------------
insert into heritage_items (
  id,
  place_id,
  title,
  status,
  language,
  contributor,
  is_illustrative
) values (
  'b2222222-2222-2222-2222-222222222222',
  '33333333-3333-4333-a333-333333333333',
  '[Illustrative] आमेर दुर्गाचे संरक्षण आणि मावठा सरोवर जलप्रवाह दप्तर नोंद',
  'verified',
  'mr',
  'Rajasthan-Maratha Archival Exchange [Illustrative]',
  true
);

insert into item_tags (item_id, tag_id) values
  ('b2222222-2222-2222-2222-222222222222', 'a0000001-0000-0000-0000-000000000005'),
  ('b2222222-2222-2222-2222-222222222222', 'a0000001-0000-0000-0000-000000000006'),
  ('b2222222-2222-2222-2222-222222222222', 'a0000001-0000-0000-0000-000000000003');

insert into media (
  id,
  item_id,
  url,
  caption,
  mime_type,
  is_illustrative
) values (
  'c2222222-2222-2222-2222-222222222222',
  'b2222222-2222-2222-2222-222222222222',
  'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&q=80',
  '[Illustrative] High-resolution register leaf detailing rampart repairs and reservoir channels at Amer Fort',
  'image/jpeg',
  true
);

insert into ocr_texts (
  id,
  media_id,
  original_text,
  language,
  confidence,
  lines,
  is_illustrative
) values (
  'd2222222-2222-2222-2222-222222222222',
  'c2222222-2222-2222-2222-222222222222',
  E'आमेर किल्ल्यावरील जलकुंभ आणि मावठा सरोवरातील जलप्रवाह संरक्षणासाठी पूर्व दिशेच्या तटबंदीची दुरुस्ती करण्यात आली.\nदुर्गपतींच्या आदेशानुसार पहारेकरी व सैनिकांसाठी पाणी साठवण्याच्या विहिरी स्वच्छ करण्यात आल्या.\nसदर कामाचा हिशोब दप्तरदार यांनी तपशीलवार नोंदवला आहे.',
  'mr',
  0.9693,
  '[
    {
      "text": "आमेर किल्ल्यावरील जलकुंभ आणि मावठा सरोवरातील जलप्रवाह संरक्षणासाठी पूर्व दिशेच्या तटबंदीची दुरुस्ती करण्यात आली.",
      "confidence": 0.9680,
      "bbox": [0.075, 0.120, 0.925, 0.185]
    },
    {
      "text": "दुर्गपतींच्या आदेशानुसार पहारेकरी व सैनिकांसाठी पाणी साठवण्याच्या विहिरी स्वच्छ करण्यात आल्या.",
      "confidence": 0.9590,
      "bbox": [0.078, 0.210, 0.895, 0.275]
    },
    {
      "text": "सदर कामाचा हिशोब दप्तरदार यांनी तपशीलवार नोंदवला आहे.",
      "confidence": 0.9810,
      "bbox": [0.076, 0.300, 0.720, 0.365]
    }
  ]'::jsonb,
  true
);

insert into translations (
  id,
  ocr_id,
  language,
  text,
  model,
  is_illustrative
) values (
  'e2222222-2222-2222-2222-222222222222',
  'd2222222-2222-2222-2222-222222222222',
  'en',
  '[Illustrative] Repairs to the eastern ramparts were carried out to safeguard the water reservoirs atop Amer Fort and regulate runoff into Maota Lake. By order of the Fort Commander, water cisterns for sentinels and garrison forces were desilted and restored. The official accounts for this endeavor have been entered by the head scribe.',
  'bhashini-nllb-200-3.3b [Illustrative]',
  true
);

insert into processing_jobs (
  item_id,
  stage,
  status,
  started_at,
  finished_at
) values (
  'b2222222-2222-2222-2222-222222222222',
  'translation',
  'completed',
  now() - interval '4 hours',
  now() - interval '3 hours 55 minutes'
);

-- -----------------------------------------------------------------------------
-- 5. Illustrative Marathi OCR Record 3: Hampi (Vijayanagara, Karnataka)
-- -----------------------------------------------------------------------------
insert into heritage_items (
  id,
  place_id,
  title,
  status,
  language,
  contributor,
  is_illustrative
) values (
  'b3333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-a444-444444444444',
  '[Illustrative] विजयनगर साम्राज्यातील हंपी विठ्ठल मंदिराचा वास्तुशास्त्रीय वृत्तांत',
  'verified',
  'mr',
  'Southern Epigraphical Survey Collection [Illustrative]',
  true
);

insert into item_tags (item_id, tag_id) values
  ('b3333333-3333-3333-3333-333333333333', 'a0000001-0000-0000-0000-000000000007'),
  ('b3333333-3333-3333-3333-333333333333', 'a0000001-0000-0000-0000-000000000008'),
  ('b3333333-3333-3333-3333-333333333333', 'a0000001-0000-0000-0000-000000000004');

insert into media (
  id,
  item_id,
  url,
  caption,
  mime_type,
  is_illustrative
) values (
  'c3333333-3333-3333-3333-333333333333',
  'b3333333-3333-3333-3333-333333333333',
  'https://images.unsplash.com/photo-1600100397608-f010f4439c2c?w=1200&q=80',
  '[Illustrative] Field rubbings and archival photograph of the stone chariot and mandapa pillars at Vittala temple complex, Hampi',
  'image/jpeg',
  true
);

insert into ocr_texts (
  id,
  media_id,
  original_text,
  language,
  confidence,
  lines,
  is_illustrative
) values (
  'd3333333-3333-3333-3333-333333333333',
  'c3333333-3333-3333-3333-333333333333',
  E'तुंगभद्रा तीरावरील विठ्ठल मंदिराचा अखंड पाषाणातील दगडी रथ आणि सप्तस्वर घुमवणारे संगीतस्तंभ.\nकृष्णदेवरायांच्या काळात मंदिराचा विस्तार होऊन भव्य कल्याणमंडप उभारण्यात आला.\nशिल्पकलेतील बारकावे आणि वास्तुशास्त्र भारतीय संस्कृतीचा सर्वोच्च गौरव दर्शवतात.',
  'mr',
  0.9647,
  '[
    {
      "text": "तुंगभद्रा तीरावरील विठ्ठल मंदिराचा अखंड पाषाणातील दगडी रथ आणि सप्तस्वर घुमवणारे संगीतस्तंभ.",
      "confidence": 0.9710,
      "bbox": [0.090, 0.110, 0.910, 0.175]
    },
    {
      "text": "कृष्णदेवरायांच्या काळात मंदिराचा विस्तार होऊन भव्य कल्याणमंडप उभारण्यात आला.",
      "confidence": 0.9650,
      "bbox": [0.088, 0.198, 0.875, 0.262]
    },
    {
      "text": "शिल्पकलेतील बारकावे आणि वास्तुशास्त्र भारतीय संस्कृतीचा सर्वोच्च गौरव दर्शवतात.",
      "confidence": 0.9580,
      "bbox": [0.091, 0.285, 0.860, 0.350]
    }
  ]'::jsonb,
  true
);

insert into translations (
  id,
  ocr_id,
  language,
  text,
  model,
  is_illustrative
) values (
  'e3333333-3333-3333-3333-333333333333',
  'd3333333-3333-3333-3333-333333333333',
  'en',
  '[Illustrative] The monolithic stone chariot and the musical pillars resonating with the seven melodic notes at the Vittala Temple on the banks of the Tungabhadra. During the reign of Emperor Krishnadevaraya, the temple complex was expanded with the construction of the grand Kalyana Mandapa. The intricacy of sculpture and architectural science represents the crowning glory of Indian culture.',
  'bhashini-nllb-200-3.3b [Illustrative]',
  true
);

insert into processing_jobs (
  item_id,
  stage,
  status,
  started_at,
  finished_at
) values (
  'b3333333-3333-3333-3333-333333333333',
  'translation',
  'completed',
  now() - interval '6 hours',
  now() - interval '5 hours 52 minutes'
);
