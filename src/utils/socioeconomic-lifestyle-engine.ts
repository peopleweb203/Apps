/**
 * Socioeconomic Stratum, Luxury Brand & Modern Lifestyle Engine
 * Coordinates wardrobe, vehicles, jewelry, and deportment to character wealth levels.
 * Generates photorealistic material finish conditioning for AI image/video synthesis.
 */

export type WealthStratum = 'ultra-luxury' | 'upper-middle' | 'working-class' | 'street-impoverished';

export interface VehicleAsset {
  id: string;
  name: string;
  category: string;
  makeModel: string;
  finishType: 'high-gloss' | 'matte-metallic' | 'standard-clearcoat' | 'weathered-matte' | 'oxidized-primer';
  finishDescription: string;
  promptToken: string;
  stratum: WealthStratum;
}

export interface WardrobeBrand {
  id: string;
  name: string;
  tier: 'Haute Couture / High Designer' | 'Contemporary Designer' | 'Utilitarian Workwear' | 'Distressed Streetwear';
  sampleGarments: string[];
  fabricFinish: string;
  promptToken: string;
  strata: WealthStratum[];
}

export interface JewelryItem {
  id: string;
  name: string;
  grade: 'Flawless Diamonds & Platinum' | '18K Gold & Sterling Silver' | 'Costume & Stainless' | 'None';
  materialFinish: string;
  promptToken: string;
  strata: WealthStratum[];
}

export interface TimepieceItem {
  id: string;
  name: string;
  horologyTier: 'High Horology' | 'Luxury Swiss' | 'Sport Chronograph' | 'Digital / Budget' | 'None';
  caseMaterial: string;
  promptToken: string;
  strata: WealthStratum[];
}

export interface DeportmentProfile {
  stratum: WealthStratum;
  title: string;
  postureDescription: string;
  kineticTraits: string[];
  gazeBehavior: string;
  promptToken: string;
}

export interface CharacterLifestyleProfile {
  characterId: string;
  stratum: WealthStratum;
  netWorthTier: string;
  selectedVehicleId: string;
  selectedWardrobeBrandIds: string[];
  selectedJewelryId: string;
  selectedTimepieceId: string;
  customNotes?: string;
}

export interface CompiledLifestylePayload {
  stratum: WealthStratum;
  vehicle: VehicleAsset;
  brands: WardrobeBrand[];
  jewelry: JewelryItem;
  timepiece: TimepieceItem;
  deportment: DeportmentProfile;
  materialFinishes: string[];
  positivePromptInjection: string;
  negativeExclusions: string[];
  coherenceScore: number; // 0-100
  coherenceWarnings: string[];
}

// -------------------------------------------------------------
// ASSET REPOSITORIES
// -------------------------------------------------------------

export const VEHICLE_REPOSITORY: VehicleAsset[] = [
  // Ultra-Luxury
  {
    id: 'veh-maybach-s680',
    name: 'Mercedes-Maybach S680',
    category: 'Ultra-Luxury Flagship Sedan',
    makeModel: 'Mercedes-Maybach S-Class V12 Bi-Turbo',
    finishType: 'high-gloss',
    finishDescription: 'Mirror-polished two-tone Obsidian Black and Kalahari Gold clearcoat, optical micro-fleck refraction, chrome vertical grille vanes',
    promptToken: 'chauffeured Mercedes-Maybach S680 V12 with pristine mirror-reflective two-tone piano lacquer clearcoat, 21-inch forged monoblock wheels',
    stratum: 'ultra-luxury',
  },
  {
    id: 'veh-g63-amg',
    name: 'Mercedes-AMG G63 (G-Wagon)',
    category: 'High-Status Luxury SUV',
    makeModel: 'Mercedes-AMG G63 4MATIC',
    finishType: 'high-gloss',
    finishDescription: 'Deep Magno Night Black high-gloss ceramic coated bodywork, side-exit exhaust tips, illuminated star emblem',
    promptToken: 'gloss-black Mercedes-AMG G63 G-Wagon with deep ceramic luster, flared wheel arches, and tinted VIP privacy glass',
    stratum: 'ultra-luxury',
  },
  {
    id: 'veh-porsche-gt3',
    name: 'Porsche 911 GT3 / Taycan',
    category: 'Exotic Track / Grand Tourer',
    makeModel: 'Porsche 911 GT3 RS Shark Blue',
    finishType: 'high-gloss',
    finishDescription: 'Liquid Shark Blue triple-layer pearl paint, carbon fiber aero wing with optical weave reflection, center-lock satin neodymium wheels',
    promptToken: 'sculptural Porsche 911 GT3 with iridescent automotive clearcoat, carbon fiber aerodynamic wing, and yellow carbon-ceramic brake calipers',
    stratum: 'ultra-luxury',
  },
  {
    id: 'veh-rolls-phantom',
    name: 'Rolls-Royce Phantom VIII',
    category: 'Imperial Chauffeured Saloon',
    makeModel: 'Rolls-Royce Phantom Extended',
    finishType: 'high-gloss',
    finishDescription: 'Flawless English White multi-coat enamel, hand-painted coachline, brushed aluminum Pantheon grille, floating center wheel caps',
    promptToken: 'stately Rolls-Royce Phantom VIII with museum-grade mirror reflection paint, Spirit of Ecstasy chrome hood ornament, and suicide coach doors',
    stratum: 'ultra-luxury',
  },

  // Upper-Middle Class
  {
    id: 'veh-bmw-3series',
    name: 'BMW 330i / M-Sport',
    category: 'Executive Sport Sedan',
    makeModel: 'BMW 3-Series M Sport Portimao Blue',
    finishType: 'standard-clearcoat',
    finishDescription: 'Portimao Blue metallic factory clearcoat, shadowline gloss trim, crisp daytime running LED halos',
    promptToken: 'late-model BMW 3-Series M Sport in clean Portimao Blue metallic paint, 19-inch bi-color alloys, and executive shadowline trim',
    stratum: 'upper-middle',
  },
  {
    id: 'veh-audi-q7',
    name: 'Audi Q7 / A6 Quattro',
    category: 'Premium Family Crossover',
    makeModel: 'Audi Q7 55 TFSI Quattro Glacier White',
    finishType: 'standard-clearcoat',
    finishDescription: 'Glacier White metallic with pristine factory shine, matrix LED headlights, roof rails',
    promptToken: 'late-model Audi Q7 Quattro SUV with clean polished Glacier White metallic paint, panoramic glass sunroof, and sleek LED matrix lighting',
    stratum: 'upper-middle',
  },
  {
    id: 'veh-lexus-rx',
    name: 'Lexus RX 350 / ES Hybrid',
    category: 'Refined Executive Crossover',
    makeModel: 'Lexus RX 350 F-Sport Caviar Metallic',
    finishType: 'standard-clearcoat',
    finishDescription: 'Caviar black metallic with subtle purple-gold pearl under direct sun, signature spindle grille',
    promptToken: 'clean Lexus RX 350 hybrid crossover with polished dark metallic finish, sharp spindle grille, and executive dealership plates',
    stratum: 'upper-middle',
  },

  // Working Class / Meager Means
  {
    id: 'veh-honda-civic',
    name: '2012 Honda Civic LX',
    category: 'Reliable Commuter Compact',
    makeModel: 'Honda Civic Sedan Taffeta White',
    finishType: 'weathered-matte',
    finishDescription: 'Taffeta White paint with minor bumper scuffs, steel wheels with silver plastic hubcaps, subtle sun fade on roof clearcoat',
    promptToken: 'daily commuter 2012 Honda Civic sedan in aged white paint, slight bumper curb-rash scuffs, and utilitarian steel wheels',
    stratum: 'working-class',
  },
  {
    id: 'veh-toyota-corolla',
    name: '2008 Toyota Corolla CE',
    category: 'Budget Economy Sedan',
    makeModel: 'Toyota Corolla Silver Streak Mica',
    finishType: 'weathered-matte',
    finishDescription: 'Silver Streak Mica with light door dings, faded headlight polycarbonate, small parking lot scrape on rear quarter panel',
    promptToken: 'utilitarian 2008 silver Toyota Corolla with modest road dust, aged plastic headlamp lenses, and humble factory stock stance',
    stratum: 'working-class',
  },
  {
    id: 'veh-ford-f150-work',
    name: 'Ford F-150 XL Work Truck',
    category: 'Trade & Utility Truck',
    makeModel: 'Ford F-150 XL Regular Cab Oxford White',
    finishType: 'weathered-matte',
    finishDescription: 'Oxford White with black unpainted plastic bumpers, diamond-plate steel toolbox in bed, light highway road grime',
    promptToken: 'practical Ford F-150 work truck with unpainted black plastic bumpers, diamond-plate bed toolbox, and working-man road dust patina',
    stratum: 'working-class',
  },

  // Street / Impoverished
  {
    id: 'veh-beater-sedan',
    name: '1998 Dented Sedan (Beater)',
    category: 'Distressed High-Mileage Vehicle',
    makeModel: '1998 Ford Taurus / Chevy Cavalier',
    finishType: 'oxidized-primer',
    finishDescription: 'Oxidized matte peeling clearcoat, mismatched black primer front fender, rusted rocker panels, duct tape on taillight lens',
    promptToken: 'weathered 1998 beater sedan with peeled clearcoat, matte primer front fender patch, rusted wheel arches, and yellowed cloudy headlights',
    stratum: 'street-impoverished',
  },
  {
    id: 'veh-public-transit',
    name: 'Metropolitan Transit / Bicycle',
    category: 'Pedestrian & Public Commute',
    makeModel: 'City Rapid Transit Bus / Scuffed 10-Speed',
    finishType: 'weathered-matte',
    finishDescription: 'Worn city transit bus card clipped to lanyard, rusted steel lock chain wrapped around scratched bicycle frame',
    promptToken: 'character relying on public transit bus stop in urban rain, scuffed ten-speed bicycle frame with chipped enamel and taped handlebar grips',
    stratum: 'street-impoverished',
  },
];

export const WARDROBE_BRANDS: WardrobeBrand[] = [
  // Ultra-Luxury
  {
    id: 'brand-gucci',
    name: 'Gucci',
    tier: 'Haute Couture / High Designer',
    sampleGarments: ['Silk monogram foulard', 'Tailored velvet blazer', 'Embroidered wool overcoat', 'Horsebit leather loafers'],
    fabricFinish: 'Gleaming silk twill weave, deep velvet pile with anisotropic light sheen, hand-burnished Italian calfskin',
    promptToken: 'custom Gucci tailored garments with subtle interlocking-G silk jacquard, pristine hand-stitched Milanese buttonholes',
    strata: ['ultra-luxury'],
  },
  {
    id: 'brand-louis-vuitton',
    name: 'Louis Vuitton',
    tier: 'Haute Couture / High Designer',
    sampleGarments: ['Embossed leather trench', 'Cashmere-blend shearling bomber', 'Monogram canvas travel accessories'],
    fabricFinish: 'Full-grain Taurillon leather with microscopic pebble texture, plush virgin cashmere fleece, polished brass hardware',
    promptToken: 'Louis Vuitton bespoke outerwear with subtle embossed monogram leather trim, gleaming palladium zip pulls',
    strata: ['ultra-luxury'],
  },
  {
    id: 'brand-savile-row',
    name: 'Savile Row Bespoke',
    tier: 'Haute Couture / High Designer',
    sampleGarments: ['Three-piece chalk stripe suit', 'Double-breasted vicuña overcoat', 'French cuff Sea Island cotton shirt'],
    fabricFinish: 'Super 180s worsted English wool with razor-sharp pressed lapel creases, mother-of-pearl buttons, fluid aristocratic drape',
    promptToken: 'bespoke Savile Row English tailored three-piece suit in Super 180s wool, razor-sharp chalk stripes, and stiff French cuffs',
    strata: ['ultra-luxury'],
  },

  // Upper-Middle
  {
    id: 'brand-ralph-lauren',
    name: 'Ralph Lauren / Theory',
    tier: 'Contemporary Designer',
    sampleGarments: ['Tailored merino crewneck', 'Structured stretch-wool blazer', 'Pleated high-rise chinos'],
    fabricFinish: 'Crisp combed cotton twill, lightweight Italian stretch suiting, matte horn buttons',
    promptToken: 'contemporary tailored smart-casual wardrobe by Ralph Lauren and Theory, crisp pressed chinos, fine merino wool knitwear',
    strata: ['upper-middle'],
  },
  {
    id: 'brand-hugo-boss',
    name: 'Hugo Boss / Acne Studios',
    tier: 'Contemporary Designer',
    sampleGarments: ['Charcoal slim-fit two-piece', 'Minimalist mock-neck sweater', 'Structured overcoat'],
    fabricFinish: 'Virgin wool blend with smooth matte surface, minimalist clean seam construction',
    promptToken: 'Hugo Boss modern tailored executive suiting, clean Scandinavian minimalist silhouette, pristine grooming',
    strata: ['upper-middle'],
  },

  // Working Class
  {
    id: 'brand-carhartt-utilitarian',
    name: 'Carhartt / Rugged Workwear',
    tier: 'Utilitarian Workwear',
    sampleGarments: ['Duck canvas Detroit jacket', 'Double-knee utility pants', 'Heavyweight thermal cotton long-sleeve'],
    fabricFinish: '12-oz firm-hand ring-spun duck cotton canvas, copper rivet reinforcements, rugged natural fabric grain',
    promptToken: 'durable unbranded Carhartt-style brown duck canvas utility jacket with corduroy collar, heavyweight work denim, and reinforced seams',
    strata: ['working-class'],
  },
  {
    id: 'brand-off-the-rack-basics',
    name: 'Unbranded Off-The-Rack',
    tier: 'Utilitarian Workwear',
    sampleGarments: ['Crewneck cotton tee', 'Mid-wash relaxed-fit denim', 'Waterproof nylon windbreaker'],
    fabricFinish: 'Pre-washed ringspun cotton, durable poly-cotton blend, honest utilitarian stitching',
    promptToken: 'unbranded practical off-the-rack cotton tee, clean relaxed-fit blue jeans, and utilitarian functional outerwear',
    strata: ['working-class'],
  },

  // Street / Impoverished
  {
    id: 'brand-distressed-streetwear',
    name: 'Frayed & Thrifted Streetwear',
    tier: 'Distressed Streetwear',
    sampleGarments: ['Oversized sun-faded hoodie', 'Torn knee washed jeans', 'Frayed hem thermal layer', 'Scuffed skate high-tops'],
    fabricFinish: 'Abraded cotton French terry with unraveling hems, salt-stained seams, mineral wash bleach fading, worn pill texture',
    promptToken: 'heavily weathered thrifted oversized hoodie with distressed frayed cuffs, salt-stained seams, and patched knees on worn faded denim',
    strata: ['street-impoverished'],
  },
];

export const JEWELRY_REPOSITORY: JewelryItem[] = [
  // Ultra-Luxury
  {
    id: 'jwl-diamond-tennis',
    name: 'VVS1 Diamond Tennis Chain & Ring',
    grade: 'Flawless Diamonds & Platinum',
    materialFinish: 'Birefringent dispersion sparkles (fire index 2.42), icy white high-clarity scintillation, mirror platinum prong settings',
    promptToken: 'iced-out VVS1 clarity diamond tennis necklace and 4-carat platinum solitaire ring with brilliant prismatic caustic light refractions',
    strata: ['ultra-luxury'],
  },
  {
    id: 'jwl-emerald-cut-platinum',
    name: 'Cartier / Graff Emerald Cut',
    grade: 'Flawless Diamonds & Platinum',
    materialFinish: 'Stepped emerald facet geometry, mirror polished 950 platinum shank, museum gemological grade',
    promptToken: 'Cartier high-jewelry emerald-cut diamond pendant suspended on micro-pavé platinum wire with high optical brilliance',
    strata: ['ultra-luxury'],
  },

  // Upper-Middle
  {
    id: 'jwl-minimalist-gold',
    name: '18K Minimalist Gold & Pearl',
    grade: '18K Gold & Sterling Silver',
    materialFinish: 'Satin brushed 18k yellow gold, luster overtone of Tahitian cultured pearl, discreet diamond stud',
    promptToken: 'tasteful 18k yellow gold band, discreet 0.5-carat diamond stud earrings, and subtle silver link chain',
    strata: ['upper-middle'],
  },

  // Working Class
  {
    id: 'jwl-stainless-simple',
    name: 'Stainless Steel / Braided Leather',
    grade: 'Costume & Stainless',
    materialFinish: 'Brushed 316L stainless steel chain, distressed black braided leather cord, stamped pewter pendant',
    promptToken: 'simple brushed stainless steel link necklace and braided leather wristband, durable and understated',
    strata: ['working-class'],
  },

  // Street / Impoverished
  {
    id: 'jwl-none',
    name: 'Zero Jewelry / Bare Skin',
    grade: 'None',
    materialFinish: 'Zero metallic ornamentation, bare wrists with faint watch tan line or calluses, unadorned neckline',
    promptToken: 'zero jewelry, bare unadorned collarbones and wrists, utilitarian physical simplicity',
    strata: ['street-impoverished', 'working-class'],
  },
];

export const TIMEPIECE_REPOSITORY: TimepieceItem[] = [
  // Ultra-Luxury
  {
    id: 'watch-rolex-daytona',
    name: 'Rolex Cosmograph Daytona',
    horologyTier: 'Luxury Swiss',
    caseMaterial: '950 Platinum with Chestnut Cerachrom bezel and ice-blue dial',
    promptToken: 'Rolex Cosmograph Daytona chronometer in platinum with ice-blue sunray dial and polished Oyster bracelet',
    strata: ['ultra-luxury'],
  },
  {
    id: 'watch-patek-nautilus',
    name: 'Patek Philippe Nautilus 5711',
    horologyTier: 'High Horology',
    caseMaterial: '18K Rose Gold with horizontally embossed brown sunburst dial',
    promptToken: 'Patek Philippe Nautilus in 18k rose gold with porthole bezel geometry and integrated brushed-and-polished link bracelet',
    strata: ['ultra-luxury'],
  },

  // Upper-Middle
  {
    id: 'watch-omega-speedmaster',
    name: 'Omega Speedmaster / Apple Watch Ultra',
    horologyTier: 'Sport Chronograph',
    caseMaterial: 'Brushed 316L stainless steel with black tachymeter bezel or titanium smartwatch',
    promptToken: 'Omega Speedmaster Professional Moonwatch chronometer on stainless steel bracelet with matte black stepped dial',
    strata: ['upper-middle'],
  },

  // Working Class
  {
    id: 'watch-casio-gshock',
    name: 'Casio G-Shock / Timex Weekender',
    horologyTier: 'Digital / Budget',
    caseMaterial: 'Matte black resin shock-resistant case with quartz LCD display',
    promptToken: 'rugged matte black Casio G-Shock digital watch with resin strap showing honest scratches on bezel',
    strata: ['working-class'],
  },

  // Street / Impoverished
  {
    id: 'watch-none',
    name: 'No Watch / Bare Wrist',
    horologyTier: 'None',
    caseMaterial: 'Bare skin with faint faded wrist crease',
    promptToken: 'bare wrist without wristwatch, raw unadorned hands',
    strata: ['street-impoverished'],
  },
];

export const DEPORTMENT_PROFILES: Record<WealthStratum, DeportmentProfile> = {
  'ultra-luxury': {
    stratum: 'ultra-luxury',
    title: 'Aristocratic Poise & Effortless Sovereign Control',
    postureDescription: 'Upright spine with relaxed clavicles, chin held at horizontal elevation, shoulders pinned back without apparent strain',
    kineticTraits: [
      'Deliberate economic gestures with zero frantic fidgeting',
      'Smooth languid head turns communicating unhurried dominance',
      'Effortless posture occupying physical space unapologetically',
    ],
    gazeBehavior: 'Steady level eye contact, calculating and unblinking, perceiving everything with calm evaluation',
    promptToken: 'regal aristocratic deportment, effortless spine alignment, calm unhurried gaze, supreme composure and status aura',
  },
  'upper-middle': {
    stratum: 'upper-middle',
    title: 'Executive Dynamism & Poised Composure',
    postureDescription: 'Erect corporate carriage, active core engagement, brisk purposeful physical tempo',
    kineticTraits: [
      'Crisp decisive hand gestures when speaking',
      'Prompt and assertive stride with heel-to-toe precision',
      'Organized physical economy holding tech devices or documents',
    ],
    gazeBehavior: 'Focused, sharp and engaging eye contact, professional attentiveness with cordial micro-nodding',
    promptToken: 'poised corporate executive posture, dynamic purposeful stride, crisp grooming, attentive and confident presence',
  },
  'working-class': {
    stratum: 'working-class',
    title: 'Grounded Utilitarian Resiliency',
    postureDescription: 'Broad centered stance, shoulders settled with the physical weight of manual or persistent endurance',
    kineticTraits: [
      'Hands casually hooked into belt loops or work jacket pockets',
      'Direct, grounded footing planted solidly on the asphalt or concrete',
      'Patient economy of movement, unpretentious physical honesty',
    ],
    gazeBehavior: 'Straightforward earnest gaze, candid and skeptical, respectful yet unyielding',
    promptToken: 'grounded utilitarian posture, sturdy relaxed footing, honest unpretentious presence, resilient physical weight',
  },
  'street-impoverished': {
    stratum: 'street-impoverished',
    title: 'Hyper-Vigilant Survivalist Poise',
    postureDescription: 'Defensively rounded shoulders, hooded head posture, tension held in the neck and trapezius',
    kineticTraits: [
      'Frequent subtle peripheral scans of room exits and street corners',
      'Guarded arms close to torso, quick reactive reflexes',
      'Lightfooted agile stance ready for instant evasion or defense',
    ],
    gazeBehavior: 'Hyper-vigilant scanning gaze, darting eye saccades assessing perimeter threats, wary caution',
    promptToken: 'distressed survivalist posture, guarded rounded shoulders, hyper-vigilant scanning eyes, tense streetwise alertness',
  },
};

// -------------------------------------------------------------
// ENGINE COMPILER & HELPERS
// -------------------------------------------------------------

export function getStratumVehicles(stratum: WealthStratum): VehicleAsset[] {
  return VEHICLE_REPOSITORY.filter((v) => v.stratum === stratum);
}

export function getStratumWardrobeBrands(stratum: WealthStratum): WardrobeBrand[] {
  return WARDROBE_BRANDS.filter((b) => b.strata.includes(stratum));
}

export function getStratumJewelry(stratum: WealthStratum): JewelryItem[] {
  return JEWELRY_REPOSITORY.filter((j) => j.strata.includes(stratum));
}

export function getStratumTimepieces(stratum: WealthStratum): TimepieceItem[] {
  return TIMEPIECE_REPOSITORY.filter((t) => t.strata.includes(stratum));
}

export function getDefaultLifestyleProfile(characterId: string, stratum: WealthStratum = 'ultra-luxury'): CharacterLifestyleProfile {
  const vehicles = getStratumVehicles(stratum);
  const brands = getStratumWardrobeBrands(stratum);
  const jewelry = getStratumJewelry(stratum);
  const timepieces = getStratumTimepieces(stratum);

  const netWorthMap: Record<WealthStratum, string> = {
    'ultra-luxury': '$50M+ (Centimillionaire / Dynasty Wealth)',
    'upper-middle': '$350K - $1.2M (Executive / High-Income Professional)',
    'working-class': '$42K - $85K (Blue-Collar / Trade / Hourly Essential)',
    'street-impoverished': '<$15K (Underground / Precarious / Street Hustle)',
  };

  return {
    characterId,
    stratum,
    netWorthTier: netWorthMap[stratum],
    selectedVehicleId: vehicles[0]?.id || 'veh-maybach-s680',
    selectedWardrobeBrandIds: [brands[0]?.id || 'brand-gucci'],
    selectedJewelryId: jewelry[0]?.id || 'jwl-diamond-tennis',
    selectedTimepieceId: timepieces[0]?.id || 'watch-rolex-daytona',
    customNotes: '',
  };
}

export function compileLifestylePayload(profile: CharacterLifestyleProfile): CompiledLifestylePayload {
  const stratum = profile.stratum;
  const deportment = DEPORTMENT_PROFILES[stratum] || DEPORTMENT_PROFILES['ultra-luxury'];

  // Resolve assets or fallback to default within stratum
  let vehicle = VEHICLE_REPOSITORY.find((v) => v.id === profile.selectedVehicleId);
  if (!vehicle) {
    vehicle = getStratumVehicles(stratum)[0] || VEHICLE_REPOSITORY[0];
  }

  let brands = WARDROBE_BRANDS.filter((b) => profile.selectedWardrobeBrandIds.includes(b.id));
  if (brands.length === 0) {
    brands = [getStratumWardrobeBrands(stratum)[0] || WARDROBE_BRANDS[0]];
  }

  let jewelry = JEWELRY_REPOSITORY.find((j) => j.id === profile.selectedJewelryId);
  if (!jewelry) {
    jewelry = getStratumJewelry(stratum)[0] || JEWELRY_REPOSITORY[0];
  }

  let timepiece = TIMEPIECE_REPOSITORY.find((t) => t.id === profile.selectedTimepieceId);
  if (!timepiece) {
    timepiece = getStratumTimepieces(stratum)[0] || TIMEPIECE_REPOSITORY[0];
  }

  // Material finish collection
  const materialFinishes: string[] = [];
  if (vehicle.finishDescription) materialFinishes.push(`Vehicle: ${vehicle.finishDescription}`);
  brands.forEach((b) => {
    if (b.fabricFinish) materialFinishes.push(`${b.name}: ${b.fabricFinish}`);
  });
  if (jewelry.materialFinish) materialFinishes.push(`Jewelry: ${jewelry.materialFinish}`);
  if (timepiece.caseMaterial) materialFinishes.push(`Horology: ${timepiece.caseMaterial}`);

  // Coherence validation & warnings
  const coherenceWarnings: string[] = [];
  let coherenceScore = 100;

  if (vehicle.stratum !== stratum) {
    coherenceWarnings.push(`Vehicle (${vehicle.name}) is classed as ${vehicle.stratum}, differing from character stratum ${stratum}.`);
    coherenceScore -= 20;
  }

  const incompatibleBrands = brands.filter((b) => !b.strata.includes(stratum));
  if (incompatibleBrands.length > 0) {
    coherenceWarnings.push(`Wardrobe brand (${incompatibleBrands.map((b) => b.name).join(', ')}) contradicts ${stratum} stratum.`);
    coherenceScore -= 15;
  }

  if (!jewelry.strata.includes(stratum)) {
    coherenceWarnings.push(`Jewelry grade (${jewelry.grade}) does not match ${stratum}.`);
    coherenceScore -= 15;
  }

  if (!timepiece.strata.includes(stratum)) {
    coherenceWarnings.push(`Timepiece (${timepiece.name}) breaks stratum authenticity.`);
    coherenceScore -= 15;
  }

  // Build positive prompt tokens
  const promptTokens: string[] = [
    `[SOCIOECONOMIC_TIER: ${stratum.toUpperCase()}]`,
    `Wardrobe styling: ${brands.map((b) => b.promptToken).join('; ')}`,
    `Deportment: ${deportment.promptToken}`,
  ];

  if (jewelry.id !== 'jwl-none') {
    promptTokens.push(`Jewelry accents: ${jewelry.promptToken}`);
  }
  if (timepiece.id !== 'watch-none') {
    promptTokens.push(`Timepiece: ${timepiece.promptToken}`);
  }
  if (vehicle.id !== 'veh-public-transit') {
    promptTokens.push(`Associated vehicle: ${vehicle.promptToken}`);
  }

  const positivePromptInjection = promptTokens.join('. ');

  // Negative exclusion tokens to prevent feature contamination
  const negativeExclusions: string[] = [];
  if (stratum === 'ultra-luxury') {
    negativeExclusions.push(
      'cheap off-the-rack polyester clothing',
      'frayed denim seams',
      'faded screen-printed graphics',
      'plastic digital watches',
      'rusted car fenders',
      'dented sedan bumpers',
      'bad posture slouching'
    );
  } else if (stratum === 'upper-middle') {
    negativeExclusions.push(
      'gaudy oversized monogram logos',
      'extreme iced-out jewelry',
      'dilapidated vehicles',
      'threadbare ragged fabrics',
      'distressed survivalist body language'
    );
  } else if (stratum === 'working-class') {
    negativeExclusions.push(
      'haute couture silk gowns',
      'Rolls Royce or Maybach cars',
      'VVS diamond tennis chains',
      'Patek Philippe luxury watches',
      'aristocratic snooty poses'
    );
  } else if (stratum === 'street-impoverished') {
    negativeExclusions.push(
      'luxury supercars',
      'designer monogram patterns',
      'gold watches',
      'sparkling diamond solitaires',
      'pristine showroom automotive gloss',
      'pampered aristocratic skin'
    );
  }

  return {
    stratum,
    vehicle,
    brands,
    jewelry,
    timepiece,
    deportment,
    materialFinishes,
    positivePromptInjection,
    negativeExclusions,
    coherenceScore: Math.max(0, coherenceScore),
    coherenceWarnings,
  };
}

/**
 * Injects socioeconomic tokens into a scene or shot prompt.
 */
export function injectSocioeconomicTokens(basePrompt: string, profile: CharacterLifestyleProfile): string {
  const compiled = compileLifestylePayload(profile);
  const cleanBase = basePrompt.trim().replace(/\.$/, '');
  return `${cleanBase}. ${compiled.positivePromptInjection}. Material accents: ${compiled.materialFinishes.slice(0, 2).join('; ')}.`;
}
