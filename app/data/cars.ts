import rawCatalog from "../../dataset/cars_ds_final.json";

type RawValue = string | number;
type RawCar = Record<string, RawValue>;

export interface SpecificationField {
  label: string;
  value: string;
}

export interface SpecificationSection {
  title: string;
  fields: SpecificationField[];
}

export interface Car {
  id: string;
  make: string;
  model: string;
  variant: string;
  year: number | null;
  price: number;
  type: string;
  fuelType: string;
  image: string;
  specs: {
    zeroToSixty: string;
    topSpeed: string;
    power: string;
    rangeOrMpg: string;
    cargoSpace: string;
  };
  datasetSpecs: {
    engineCc: number;
    torque: number;
    transmission: string;
    fuelTankCapacity: number;
    mileageCombined: number;
    seatingCapacity: number;
    groundClearance: number;
    safetyRating: number;
    airbagsCount: number;
  };
  specifications: SpecificationSection[];
  metrics: {
    performance: number;
    efficiency: number;
    utility: number;
    value: number;
    comfort: number;
  };
  bestUseCases: string[];
  keyFeatures: string[];
  pros: string[];
  cons: string[];
  tagline: string;
  description: string;
}

export interface UserPreferences {
  budget: number;
  types: string[];
  fuels: string[];
  metrics: {
    performance: number;
    efficiency: number;
    utility: number;
    value: number;
    comfort: number;
  };
}

const catalog = rawCatalog as unknown as RawCar[];
const excludedFields = new Set([
  "",
  "Make",
  "Model",
  "Variant",
  "Ex-Showroom_Price",
]);
const sectionOrder = [
  "Performance & Powertrain",
  "Body & Dimensions",
  "Safety",
  "Comfort & Convenience",
  "Entertainment & Connectivity",
  "Ownership & Efficiency",
  "Other Specifications",
];

const categoryRules: [string, RegExp][] = [
  [
    "Performance & Powertrain",
    /Displacement|Cylinders|Valves|Drivetrain|Cylinder|Emission|Engine|Fuel_System|Gears|Power|Torque|Turbocharger|Battery|Electric_Range/i,
  ],
  [
    "Body & Dimensions",
    /Body_Type|Height|Length|Width|Doors|Kerb_Weight|Ground_Clearance|Wheelbase|Track|Tyre|Wheels|Boot_Space|Turning_Radius|Suspension|Brakes/i,
  ],
  [
    "Safety",
    /Airbag|ABS|EBD|ESP|Seat.Belt|Child_Safety|ISOFIX|Hill_Assist|Traction_Control|Alert_System|Door_Ajar|Immobilizer|Parking_Assistance/i,
  ],
  [
    "Comfort & Convenience",
    /Seating|Seats|Ventilation|AC_Vents|Power_Seats|Power_Windows|Power_Steering|Keyless|Central_Locking|Sun_Visor|Cup_Holders|Door_Pockets|Seat_Height|Heated|Cooled|Mirror|Start.*Stop|Handbrake/i,
  ],
  [
    "Entertainment & Connectivity",
    /Audio|Bluetooth|USB|Aux|Radio|Infotainment|Apple|Android|Navigation|iPod|Voice|Display|Odometer|Speedometer|Tachometer|Tripmeter|Clock|Instrument/i,
  ],
  [
    "Ownership & Efficiency",
    /Price|Warranty|Fuel_Type|Mileage|Fuel_Tank|Consumption|Fuel_Gauge|Distance_to_Empty|Average_Speed/i,
  ],
];

const textValue = (value: RawValue | undefined): string => {
  if (value === undefined) return "";
  return String(value).trim().replace(/^\?+/, "");
};

const numberValue = (value: RawValue | undefined): number => {
  if (value === undefined) return 0;
  const numericToken = String(value).match(/-?\d[\d,]*(?:\.\d+)?/)?.[0];
  const parsed = Number(numericToken?.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const parsePrice = (value: RawValue | undefined): number => {
  if (value === undefined) return 0;
  if (typeof value === "number") return value;

  const amount = numberValue(value);
  if (/crore|crores|\bcr\b/i.test(value)) return amount * 10_000_000;
  if (/lakh|lakhs|\blac\b/i.test(value)) return amount * 100_000;

  return amount > 0 && amount < 100_000 ? amount * 10_000_000 : amount;
};

const humanize = (field: string): string =>
  field
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase())
    .trim();

const categoryFor = (field: string): string =>
  categoryRules.find(([, pattern]) => pattern.test(field))?.[0] ??
  "Other Specifications";

const getMileage = (car: RawCar): string =>
  textValue(
    car.ARAI_Certified_Mileage ||
      car.City_Mileage ||
      car.Highway_Mileage ||
      car.ARAI_Certified_Mileage_for_CNG ||
      car.Electric_Range,
  ) || "Not listed";

const makeSections = (car: RawCar): SpecificationSection[] => {
  const grouped = new Map<string, SpecificationField[]>();

  for (const [key, rawValue] of Object.entries(car)) {
    if (excludedFields.has(key)) continue;
    const value = textValue(rawValue);
    if (!value || value === "?") continue;
    const title = categoryFor(key);
    const fields = grouped.get(title) ?? [];
    fields.push({ label: humanize(key), value });
    grouped.set(title, fields);
  }

  return sectionOrder.flatMap((title) => {
    const fields = grouped.get(title);
    return fields?.length ? [{ title, fields }] : [];
  });
};

const clampScore = (value: number): number =>
  Math.max(1, Math.min(10, Math.round(value)));

const toScore = (value: number, min: number, max: number): number =>
  clampScore(1 + ((value - min) / (max - min)) * 9);

const toCar = (source: RawCar, index: number): Car => {
  const make = textValue(source.Make) || "Unknown make";
  const model = textValue(source.Model) || "Unknown model";
  const variant = textValue(source.Variant);
  const price = parsePrice(source["Ex-Showroom_Price"]);
  const mileage = numberValue(
    source.ARAI_Certified_Mileage ||
      source.City_Mileage ||
      source.Highway_Mileage,
  );
  const power = numberValue(source.Power);
  const seating =
    numberValue(source.Seating_Capacity) ||
    numberValue(variant.match(/\b([2-9])(?:-|\s)?seater\b/i)?.[1]);
  const bootSpace = numberValue(source.Boot_Space);
  const features = makeSections(source);
  const featureCount = features.reduce(
    (count, section) => count + section.fields.length,
    0,
  );
  const combinedModel = variant ? `${model} ${variant}` : model;

  return {
    id: `car-${numberValue(source[""]) || index}`,
    make,
    model,
    variant,
    year: null,
    price,
    type: textValue(source.Body_Type) || "Unclassified",
    fuelType: textValue(source.Fuel_Type) || "Unspecified",
    image: "",
    specs: {
      zeroToSixty: "Not listed",
      topSpeed: "Not listed",
      power: textValue(source.Power) || "Not listed",
      rangeOrMpg: getMileage(source),
      cargoSpace: textValue(source.Boot_Space) || "Not listed",
    },
    datasetSpecs: {
      engineCc: numberValue(source.Displacement),
      torque: numberValue(source.Torque),
      transmission: textValue(source.Type) || "Not listed",
      fuelTankCapacity: numberValue(source.Fuel_Tank_Capacity),
      mileageCombined: mileage,
      seatingCapacity: seating,
      groundClearance: numberValue(source.Ground_Clearance),
      safetyRating: 0,
      airbagsCount: numberValue(source.Number_of_Airbags),
    },
    specifications: features,
    metrics: {
      performance: toScore(power, 35, 400),
      efficiency: toScore(mileage, 5, 40),
      utility: toScore(bootSpace + seating * 80, 300, 1800),
      value: clampScore(10 - (price / Math.max(1, maxCatalogPrice)) * 9),
      comfort: clampScore(1 + seating + Math.min(featureCount / 20, 4)),
    },
    bestUseCases: [
      `${source.Body_Type ?? "Car"} driving`,
      seating ? `${seating} seat travel` : "Everyday driving",
    ],
    keyFeatures: features
      .flatMap((section) => section.fields)
      .filter(({ value }) => /yes|standard|automatic|electric/i.test(value))
      .slice(0, 4)
      .map(({ label }) => label),
    pros: [
      textValue(source.Power) && `${textValue(source.Power)} output`,
      textValue(source.ARAI_Certified_Mileage) &&
        `${getMileage(source)} certified mileage`,
      seating && `${seating} seats`,
    ].filter((item): item is string => Boolean(item)),
    cons: [
      !numberValue(source.Number_of_Airbags) ? "Airbag count not listed" : "",
      !textValue(source["ABS_(Anti-lock_Braking_System)"])
        ? "ABS information not listed"
        : "",
      !textValue(source.Basic_Warranty)
        ? "Warranty information not listed"
        : "",
    ].filter(Boolean),
    tagline: `${make} ${combinedModel}${price ? ` · ${formatINR(price)}` : ""}`,
    description: `${make} ${combinedModel} specifications from the AutoMatch vehicle catalog. The listed price and equipment reflect the selected variant where supplied.`,
  };
};

const maxCatalogPrice = Math.max(
  ...catalog.map((car) => parsePrice(car["Ex-Showroom_Price"])),
);

export const carsDatabase: Car[] = catalog.map(toCar);
export const vehicleTypes = [
  ...new Set(carsDatabase.map((car) => car.type)),
].sort();
export const fuelTypes = [
  ...new Set(carsDatabase.map((car) => car.fuelType)),
].sort();
export const MIN_BUDGET = 600_000;
export const MAX_BUDGET = 20_000_000;
export const BUDGET_STEP = 100_000;

export function formatINR(value: number): string {
  if (value >= 10_000_000) {
    const crore = (value / 10_000_000).toFixed(2);
    return `₹${crore.replace(/\.00$/, "")} Cr`;
  }
  if (value >= 100_000) {
    const lakh = (value / 100_000).toFixed(2);
    return `₹${lakh.replace(/\.00$/, "")} Lakh`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatINRFull(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function getRecommendations(
  preferences: UserPreferences,
): { car: Car; matchPercentage: number }[] {
  const { budget, types, fuels, metrics: userMetrics } = preferences;

  return carsDatabase
    .map((car) => {
      const overBudgetRatio =
        budget > 0 ? Math.max(0, car.price - budget) / budget : 1;
      const budgetPenalty =
        overBudgetRatio > 0.2 ? 50 : (overBudgetRatio / 0.2) * 25;
      const typeBonus =
        types.length === 0 ? 0 : types.includes(car.type) ? 5 : -15;
      const fuelBonus =
        fuels.length === 0 ? 0 : fuels.includes(car.fuelType) ? 5 : -15;
      const keys = Object.keys(userMetrics) as (keyof typeof userMetrics)[];
      let weightedDifference = 0;
      let totalWeight = 0;

      for (const key of keys) {
        const preferred = userMetrics[key];
        const weight = preferred >= 7 ? 2 : preferred <= 3 ? 0.5 : 1;
        weightedDifference += Math.abs(preferred - car.metrics[key]) * weight;
        totalWeight += weight;
      }

      const baseCompatibility = 100 - (weightedDifference / totalWeight) * 8;
      const matchPercentage = Math.round(
        Math.max(
          0,
          Math.min(
            100,
            baseCompatibility + typeBonus + fuelBonus - budgetPenalty,
          ),
        ),
      );

      return { car, matchPercentage };
    })
    .sort((left, right) => right.matchPercentage - left.matchPercentage);
}
