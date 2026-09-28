import { carsDatabase, Car } from "@/app/data/cars";
import { UserVectorData, vectorDataToArray } from "./types";

export interface CarVector {
  carId: string;
  vector: number[]; // 7 dimensions
  breakdown: UserVectorData;
}

export interface RecommendationResult {
  car: Car;
  matchPercentage: number;
  cosineScore: number;
  explanationBadges: {
    title: string;
    description: string;
    impact: "high" | "medium";
  }[];
  specComparison: {
    label: string;
    userPreference: number; // 0-100
    carCapability: number; // 0-100
  }[];
}

const DIMENSION_NAMES: (keyof UserVectorData)[] = [
  "affordability",
  "familySafety",
  "terrainClearance",
  "urbanAgility",
  "performancePower",
  "fuelEfficiency",
  "techComfort",
];

const DIMENSION_LABELS: Record<keyof UserVectorData, string> = {
  affordability: "Budget Value",
  familySafety: "Family & Safety",
  terrainClearance: "Terrain Clearance",
  urbanAgility: "Urban Traffic Agility",
  performancePower: "Engine Performance",
  fuelEfficiency: "Fuel Efficiency",
  techComfort: "Tech & Creature Comforts",
};

/**
 * Normalizes a real car from cars_ds_final.json into a 7-dimensional latent feature vector [0.0 - 1.0].
 */
export function extractCarVector(car: Car): CarVector {
  const specs = car.datasetSpecs;
  const rawFields = car.specifications.flatMap((s) => s.fields);
  const findSpec = (pattern: RegExp) =>
    rawFields.some((f) => pattern.test(f.label) && /yes|true|standard|automatic|all/i.test(f.value));

  // 1. Affordability (Price Inversion)
  let affordability = 0.5;
  if (car.price > 0) {
    if (car.price < 800000) affordability = 0.95;
    else if (car.price < 1500000) affordability = 0.82;
    else if (car.price < 2500000) affordability = 0.65;
    else if (car.price < 4000000) affordability = 0.45;
    else if (car.price < 8000000) affordability = 0.3;
    else affordability = 0.15;
  }

  // 2. Family & Safety
  let safetyScore = 0.3;
  if (specs.seatingCapacity >= 7) safetyScore += 0.35;
  else if (specs.seatingCapacity >= 6) safetyScore += 0.25;
  else if (specs.seatingCapacity >= 5) safetyScore += 0.15;

  if (specs.airbagsCount >= 6) safetyScore += 0.35;
  else if (specs.airbagsCount >= 2) safetyScore += 0.2;
  else if (specs.airbagsCount >= 1) safetyScore += 0.1;

  if (findSpec(/isofix|child.seat/i)) safetyScore += 0.15;
  if (findSpec(/abs|esp|traction/i)) safetyScore += 0.1;
  const familySafety = Math.min(0.99, Math.max(0.1, safetyScore));

  // 3. Terrain Clearance
  let clearanceScore = 0.35;
  if (specs.groundClearance >= 205) clearanceScore = 0.95;
  else if (specs.groundClearance >= 190) clearanceScore = 0.85;
  else if (specs.groundClearance >= 175) clearanceScore = 0.7;
  else if (specs.groundClearance >= 160) clearanceScore = 0.5;
  else if (specs.groundClearance > 0) clearanceScore = 0.35;

  if (/suv|4x4|awd/i.test(car.type)) clearanceScore += 0.15;
  if (findSpec(/hill.assist|all.wheel/i)) clearanceScore += 0.1;
  const terrainClearance = Math.min(0.99, Math.max(0.1, clearanceScore));

  // 4. Urban Agility
  let agilityScore = 0.4;
  if (/automatic|amt|cvt|dct/i.test(specs.transmission) || /automatic/i.test(car.tagline)) {
    agilityScore += 0.35;
  }
  if (/hatchback/i.test(car.type)) agilityScore += 0.25;
  if (specs.mileageCombined >= 18) agilityScore += 0.15;
  const urbanAgility = Math.min(0.99, Math.max(0.1, agilityScore));

  // 5. Performance & Power
  let perfScore = 0.35;
  if (specs.engineCc >= 3000) perfScore = 0.95;
  else if (specs.engineCc >= 2000) perfScore = 0.8;
  else if (specs.engineCc >= 1400) perfScore = 0.6;
  else if (specs.engineCc >= 1000) perfScore = 0.45;

  if (specs.torque >= 350) perfScore = Math.max(perfScore, 0.9);
  else if (specs.torque >= 200) perfScore = Math.max(perfScore, 0.7);

  if (/turbo|sport|coupe/i.test(car.type) || /turbo/i.test(car.variant)) perfScore += 0.15;
  const performancePower = Math.min(0.99, Math.max(0.1, perfScore));

  // 6. Fuel Efficiency
  let effScore = 0.45;
  if (/electric|ev/i.test(car.fuelType)) effScore = 0.98;
  else if (/cng|hybrid/i.test(car.fuelType)) effScore = 0.92;
  else if (specs.mileageCombined >= 23) effScore = 0.9;
  else if (specs.mileageCombined >= 18) effScore = 0.75;
  else if (specs.mileageCombined >= 14) effScore = 0.6;
  else if (specs.mileageCombined > 0) effScore = 0.4;
  const fuelEfficiency = Math.min(0.99, Math.max(0.1, effScore));

  // 7. Tech & Comfort
  let techScore = 0.35;
  if (findSpec(/touchscreen|apple.carplay|android.auto|infotainment/i)) techScore += 0.25;
  if (findSpec(/sunroof|moonroof/i)) techScore += 0.2;
  if (findSpec(/automatic.climate|dual.zone|ventilated/i)) techScore += 0.15;
  if (findSpec(/cruise.control|cruise/i)) techScore += 0.1;
  if (findSpec(/parking.camera|360|sensors/i)) techScore += 0.1;
  const techComfort = Math.min(0.99, Math.max(0.1, techScore));

  const breakdown: UserVectorData = {
    affordability: Number(affordability.toFixed(2)),
    familySafety: Number(familySafety.toFixed(2)),
    terrainClearance: Number(terrainClearance.toFixed(2)),
    urbanAgility: Number(urbanAgility.toFixed(2)),
    performancePower: Number(performancePower.toFixed(2)),
    fuelEfficiency: Number(fuelEfficiency.toFixed(2)),
    techComfort: Number(techComfort.toFixed(2)),
  };

  return {
    carId: car.id,
    vector: vectorDataToArray(breakdown),
    breakdown,
  };
}

// Pre-compute vector cache for the entire catalog for sub-millisecond retrieval
const carVectorCache = new Map<string, CarVector>();
for (const car of carsDatabase) {
  carVectorCache.set(car.id, extractCarVector(car));
}

/**
 * Computes Cosine Similarity between two N-dimensional numerical vectors.
 */
export function computeCosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates SHAP-Style Explainability Badges for a recommended car.
 * Identifies the top 2 feature dimensions where user desire and car capability strongly align.
 */
function generateExplainability(
  userVector: UserVectorData,
  carVector: UserVectorData,
  car: Car,
): { title: string; description: string; impact: "high" | "medium" }[] {
  const contributions = DIMENSION_NAMES.map((dim) => {
    const userVal = userVector[dim];
    const carVal = carVector[dim];
    // Product contribution
    const alignment = userVal * carVal;
    return { dim, userVal, carVal, alignment };
  }).sort((a, b) => b.alignment - a.alignment);

  const badges: { title: string; description: string; impact: "high" | "medium" }[] = [];

  for (const top of contributions.slice(0, 2)) {
    if (top.dim === "terrainClearance" && top.carVal >= 0.7) {
      badges.push({
        title: "Terrain Alignment",
        description: `${car.datasetSpecs.groundClearance || 190}mm ground clearance matches your route & terrain profile.`,
        impact: "high",
      });
    } else if (top.dim === "familySafety" && top.carVal >= 0.6) {
      badges.push({
        title: "Family Protection",
        description: `${car.datasetSpecs.airbagsCount || "Multi"} airbags & ${car.datasetSpecs.seatingCapacity || 5}-seater layout fits your family size.`,
        impact: "high",
      });
    } else if (top.dim === "urbanAgility" && top.carVal >= 0.6) {
      badges.push({
        title: "City Traffic Ease",
        description: `${car.datasetSpecs.transmission || "Automatic"} drive setup delivers smooth stop-and-go metro commuting.`,
        impact: "medium",
      });
    } else if (top.dim === "fuelEfficiency" && top.carVal >= 0.7) {
      badges.push({
        title: "Mileage Optimizer",
        description: `${car.specs.rangeOrMpg || "High"} certified efficiency cuts your recurring commute expense.`,
        impact: "medium",
      });
    } else if (top.dim === "performancePower" && top.carVal >= 0.7) {
      badges.push({
        title: "Performance Match",
        description: `${car.specs.power || "High output"} powertrain aligns with your spirited driving preference.`,
        impact: "high",
      });
    } else if (top.dim === "techComfort" && top.carVal >= 0.7) {
      badges.push({
        title: "Tech & Luxury",
        description: `Premium infotainment & convenience equipment matches your desired comfort level.`,
        impact: "medium",
      });
    } else if (top.dim === "affordability") {
      badges.push({
        title: "Value Proposition",
        description: `Strong price-to-equipment balance within your target acquisition budget.`,
        impact: "medium",
      });
    }
  }

  if (badges.length === 0) {
    badges.push({
      title: "Balanced Profile",
      description: "Well-rounded capability score across your daily driving parameters.",
      impact: "medium",
    });
  }

  return badges;
}

/**
 * Main Vector Recommendation Engine Function.
 * Ranks cars via Cosine Similarity against the User Latent Vector.
 */
export function getVectorRecommendations(
  userVector: UserVectorData,
  options?: {
    budgetLimit?: number;
    types?: string[];
    fuels?: string[];
    searchQuery?: string;
    limit?: number;
  },
): RecommendationResult[] {
  const userArray = vectorDataToArray(userVector);
  const budget = options?.budgetLimit || 0;
  const types = options?.types || [];
  const fuels = options?.fuels || [];
  const query = options?.searchQuery?.toLowerCase().trim();
  const queryTokens = query ? query.split(/\s+/).filter(Boolean) : [];

  const results: RecommendationResult[] = [];

  for (const car of carsDatabase) {
    // 1. Search query filter (matches make, model, variant, type, fuel, tagline, features)
    if (queryTokens.length > 0) {
      const searchableText = `${car.make} ${car.model} ${car.variant || ""} ${car.type} ${car.fuelType} ${car.tagline || ""} ${car.keyFeatures?.join(" ") || ""}`.toLowerCase();
      const matchesAllTokens = queryTokens.every((token) => searchableText.includes(token));
      if (!matchesAllTokens) {
        continue;
      }
    }

    // 2. Budget filtering:
    // If the user explicitly searched for a specific brand or model (e.g. Ferrari, Rolls-Royce, Porsche),
    // don't hide the car just because the commuter budget ceiling slider is set lower than a multi-crore exotic.
    const isSpecificBrandOrModelSearch =
      queryTokens.length > 0 &&
      queryTokens.some(
        (token) =>
          car.make.toLowerCase().includes(token) ||
          car.model.toLowerCase().includes(token),
      );

    if (!isSpecificBrandOrModelSearch && budget > 0 && car.price > budget * 1.35) {
      continue; // Filter out cars that are >35% over budget
    }

    // 3. Type filter if selected (bypass if explicit brand/model search)
    if (!isSpecificBrandOrModelSearch && types.length > 0 && !types.includes(car.type)) {
      continue;
    }

    // 4. Fuel filter if selected
    if (fuels.length > 0 && !fuels.includes(car.fuelType)) {
      continue;
    }

    const carVector = carVectorCache.get(car.id) || extractCarVector(car);
    const cosine = computeCosineSimilarity(userArray, carVector.vector);

    // Convert cosine similarity (typically 0.65 to 0.98 in dense positive space) to human match % (60% - 99%)
    const matchPercentage = Math.round(Math.min(99, Math.max(50, cosine * 100)));

    const explanationBadges = generateExplainability(userVector, carVector.breakdown, car);

    const specComparison = DIMENSION_NAMES.map((dim) => ({
      label: DIMENSION_LABELS[dim],
      userPreference: Math.round(userVector[dim] * 100),
      carCapability: Math.round(carVector.breakdown[dim] * 100),
    }));

    results.push({
      car,
      matchPercentage,
      cosineScore: Number(cosine.toFixed(4)),
      explanationBadges,
      specComparison,
    });
  }

  // Rank by match percentage descending, then price ascending
  results.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    return a.car.price - b.car.price;
  });

  return options?.limit ? results.slice(0, options.limit) : results;
}
