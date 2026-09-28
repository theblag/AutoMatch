export interface UserDemographics {
  age: number;
  maritalStatus: "Single" | "Married" | "Married with Kids" | "Joint Family";
  locationType: "Metro / City" | "Suburban / Highway" | "Hilly / Rough Terrain";
  primaryUsage:
    | "Daily Commute"
    | "Family Road Trips"
    | "Performance Enthusiast"
    | "Rural / Rough Roads";
  budgetMax: number;
}

export interface UserVectorData {
  affordability: number;
  familySafety: number;
  terrainClearance: number;
  urbanAgility: number;
  performancePower: number;
  fuelEfficiency: number;
  techComfort: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profileCompleted: boolean;
  age?: number | null;
  maritalStatus?: string | null;
  locationType?: string | null;
  primaryUsage?: string | null;
  budgetMax?: number | null;
}

/**
 * Cold-Start Mathematical Prior Vector Generator.
 * Converts initial sign-up demographic questions into a 7D normalized vector [0.0 - 1.0].
 */
export function computeColdStartVector(demo: UserDemographics): UserVectorData {
  let affordability = 0.5;
  let familySafety = 0.4;
  let terrainClearance = 0.4;
  let urbanAgility = 0.5;
  let performancePower = 0.5;
  let fuelEfficiency = 0.6;
  let techComfort = 0.6;

  // 1. Budget Affordability mapping
  if (demo.budgetMax <= 1000000) {
    affordability = 0.95;
    fuelEfficiency = 0.9;
  } else if (demo.budgetMax <= 2000000) {
    affordability = 0.75;
  } else if (demo.budgetMax <= 4000000) {
    affordability = 0.5;
    techComfort = 0.8;
  } else {
    affordability = 0.25;
    techComfort = 0.95;
    performancePower = 0.85;
  }

  // 2. Household & Marital Status
  if (demo.maritalStatus === "Married with Kids") {
    familySafety = 0.95;
    urbanAgility = 0.45;
  } else if (demo.maritalStatus === "Joint Family") {
    familySafety = 0.98;
    terrainClearance = 0.65;
  } else if (demo.maritalStatus === "Single") {
    familySafety = 0.35;
    urbanAgility = 0.75;
    performancePower += 0.15;
  } else if (demo.maritalStatus === "Married") {
    familySafety = 0.7;
    techComfort = 0.75;
  }

  // 3. Location / Terrain
  if (demo.locationType === "Hilly / Rough Terrain") {
    terrainClearance = 0.95;
    urbanAgility = 0.3;
  } else if (demo.locationType === "Metro / City") {
    urbanAgility = 0.92;
    fuelEfficiency = Math.max(fuelEfficiency, 0.8);
    terrainClearance = 0.35;
  } else if (demo.locationType === "Suburban / Highway") {
    performancePower = Math.max(performancePower, 0.7);
    terrainClearance = 0.6;
  }

  // 4. Primary Usage
  if (demo.primaryUsage === "Performance Enthusiast") {
    performancePower = 0.95;
    fuelEfficiency = 0.35;
    techComfort = 0.85;
  } else if (demo.primaryUsage === "Daily Commute") {
    urbanAgility = Math.max(urbanAgility, 0.85);
    fuelEfficiency = Math.max(fuelEfficiency, 0.85);
  } else if (demo.primaryUsage === "Family Road Trips") {
    familySafety = Math.max(familySafety, 0.85);
    techComfort = Math.max(techComfort, 0.8);
    terrainClearance = Math.max(terrainClearance, 0.7);
  } else if (demo.primaryUsage === "Rural / Rough Roads") {
    terrainClearance = 0.95;
    familySafety = Math.max(familySafety, 0.7);
  }

  // 5. Age adjustments
  if (demo.age < 27) {
    performancePower = Math.min(1.0, performancePower + 0.15);
    techComfort = Math.min(1.0, techComfort + 0.1);
  } else if (demo.age > 48) {
    techComfort = Math.min(1.0, techComfort + 0.1);
    familySafety = Math.min(1.0, familySafety + 0.1);
    performancePower = Math.max(0.3, performancePower - 0.1);
  }

  const clamp = (val: number) =>
    Math.max(0.05, Math.min(0.99, Number(val.toFixed(2))));

  return {
    affordability: clamp(affordability),
    familySafety: clamp(familySafety),
    terrainClearance: clamp(terrainClearance),
    urbanAgility: clamp(urbanAgility),
    performancePower: clamp(performancePower),
    fuelEfficiency: clamp(fuelEfficiency),
    techComfort: clamp(techComfort),
  };
}

export function vectorDataToArray(v: UserVectorData): number[] {
  return [
    v.affordability,
    v.familySafety,
    v.terrainClearance,
    v.urbanAgility,
    v.performancePower,
    v.fuelEfficiency,
    v.techComfort,
  ];
}

export function arrayToVectorData(arr: number[]): UserVectorData {
  return {
    affordability: arr[0] ?? 0.5,
    familySafety: arr[1] ?? 0.5,
    terrainClearance: arr[2] ?? 0.5,
    urbanAgility: arr[3] ?? 0.5,
    performancePower: arr[4] ?? 0.5,
    fuelEfficiency: arr[5] ?? 0.5,
    techComfort: arr[6] ?? 0.5,
  };
}

/**
 * Shifts the user's 7D latent vector towards a vehicle they interacted with.
 * Uses Exponential Moving Average (EMA) to ensure smooth, natural online learning.
 */
export function adaptUserVector(
  current: UserVectorData,
  carVector: number[],
  actionType: "CLICK" | "VIEW_SPECS" | "COMPARE" | "LIKE" = "CLICK",
): UserVectorData {
  const lrMap: Record<string, number> = {
    CLICK: 0.08,
    VIEW_SPECS: 0.12,
    COMPARE: 0.18,
    LIKE: 0.25,
  };
  const lr = lrMap[actionType] || 0.1;
  const clamp = (val: number) =>
    Math.max(0.05, Math.min(0.99, Number(val.toFixed(3))));

  return {
    affordability: clamp(current.affordability * (1 - lr) + (carVector[0] ?? 0.5) * lr),
    familySafety: clamp(current.familySafety * (1 - lr) + (carVector[1] ?? 0.5) * lr),
    terrainClearance: clamp(current.terrainClearance * (1 - lr) + (carVector[2] ?? 0.5) * lr),
    urbanAgility: clamp(current.urbanAgility * (1 - lr) + (carVector[3] ?? 0.5) * lr),
    performancePower: clamp(current.performancePower * (1 - lr) + (carVector[4] ?? 0.5) * lr),
    fuelEfficiency: clamp(current.fuelEfficiency * (1 - lr) + (carVector[5] ?? 0.5) * lr),
    techComfort: clamp(current.techComfort * (1 - lr) + (carVector[6] ?? 0.5) * lr),
  };
}

