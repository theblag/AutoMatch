import rawCars from "../../dataset/automatch_70_realistic_cars.json";

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  type: "SUV" | "Sedan" | "Hatchback" | "Coupe" | "Truck" | "MUV";
  fuelType: "Electric" | "Hybrid" | "Gas" | "Petrol" | "Diesel";
  image: string;
  specs: {
    zeroToSixty: string;
    topSpeed: string;
    power: string;
    rangeOrMpg: string;
    cargoSpace: string;
  };
  metrics: {
    performance: number; // 1-10
    efficiency: number; // 1-10
    utility: number; // 1-10
    value: number; // 1-10
    comfort: number; // 1-10
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
  types: string[]; // SUV, Sedan, etc. Empty means any.
  fuels: string[]; // Electric, Hybrid, Gas. Empty means any.
  metrics: {
    performance: number; // 1-10
    efficiency: number; // 1-10
    utility: number; // 1-10
    value: number; // 1-10
    comfort: number; // 1-10
  };
}

export function formatINR(val: number): string {
  if (val >= 10000000) {
    const cr = (val / 10000000).toFixed(2);
    return `₹${cr.replace(/\.00$/, "")} Cr`;
  }
  if (val >= 100000) {
    const lakh = (val / 100000).toFixed(2);
    return `₹${lakh.replace(/\.00$/, "")} Lakh`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

export function formatINRFull(val: number): string {
  return `₹${val.toLocaleString("en-IN")}`;
}

const legacyCarsDatabase: Car[] = [
  {
    id: "tesla-model-y",
    make: "Tesla",
    model: "Model Y Long Range",
    year: 2026,
    price: 4100000,
    type: "SUV",
    fuelType: "Electric",
    image: "/cars/tesla-model-y.png",
    specs: {
      zeroToSixty: "4.8s",
      topSpeed: "135 mph",
      power: "384 hp",
      rangeOrMpg: "308 mi (EPA)",
      cargoSpace: "76.2 cu ft",
    },
    metrics: {
      performance: 7,
      efficiency: 9,
      utility: 8,
      value: 8,
      comfort: 7,
    },
    bestUseCases: [
      "Daily Commute",
      "Family Road Trips",
      "Eco-Conscious Travel",
    ],
    keyFeatures: [
      "Autopilot",
      "Supercharger Network",
      "Sentry Mode",
      "OTA Updates",
    ],
    pros: [
      "Excellent cargo space",
      "Industry-leading charging network",
      "Very low operating cost",
    ],
    cons: [
      "Firm ride quality",
      "No physical buttons for core controls",
      "Tesla-only app ecosystem integration",
    ],
    tagline: "The ultimate practical electric utility vehicle.",
    description:
      "The Model Y blends versatility, electric efficiency, and cutting-edge tech. With massive cargo capacity and access to the Supercharger network, it defines the modern electric family cruiser.",
  },
  {
    id: "porsche-taycan",
    make: "Porsche",
    model: "Taycan 4S",
    year: 2026,
    price: 10100000,
    type: "Sedan",
    fuelType: "Electric",
    image: "/cars/porsche-taycan.png",
    specs: {
      zeroToSixty: "3.5s",
      topSpeed: "155 mph",
      power: "536 hp",
      rangeOrMpg: "280 mi (EPA)",
      cargoSpace: "14.3 cu ft",
    },
    metrics: {
      performance: 10,
      efficiency: 7,
      utility: 4,
      value: 4,
      comfort: 9,
    },
    bestUseCases: ["Track & Performance", "Luxury Cruising", "Weekend Fun"],
    keyFeatures: [
      "800V Architecture (320kW Charging)",
      "Adaptive Air Suspension",
      "Active Aerodynamics",
      "Launch Control",
    ],
    pros: [
      "Stunning sports-car handling",
      "Sublime design & build quality",
      "Ultra-fast DC charging",
    ],
    cons: [
      "Extremely expensive options list",
      "Modest cargo & rear seat space",
      "Heavy curb weight",
    ],
    tagline: "Electric performance, engineered by Weissach.",
    description:
      "The Taycan 4S proves that transitioning to electric does not mean sacrificing driving dynamics. It is first and foremost a Porsche, delivering razor-sharp handling and breathtaking acceleration alongside luxury comfort.",
  },
  {
    id: "toyota-rav4-prime",
    make: "Toyota",
    model: "RAV4 Prime XSE",
    year: 2026,
    price: 3700000,
    type: "SUV",
    fuelType: "Hybrid",
    image: "/cars/toyota-rav4-prime.png",
    specs: {
      zeroToSixty: "5.7s",
      topSpeed: "120 mph",
      power: "302 hp",
      rangeOrMpg: "42 mi EV / 38 mpg",
      cargoSpace: "33.5 cu ft",
    },
    metrics: {
      performance: 6,
      efficiency: 9,
      utility: 9,
      value: 8,
      comfort: 8,
    },
    bestUseCases: ["Daily Commute", "All-Weather Adventuring", "Long Trips"],
    keyFeatures: [
      "Plug-in Hybrid System",
      "Electronic AWD",
      "Toyota Safety Sense 3.0",
      "120V Outlet",
    ],
    pros: [
      "42 miles of pure electric range",
      "Impressively quick acceleration",
      "Reliable and user-friendly design",
    ],
    cons: [
      "Engine noise under heavy acceleration",
      "Infotainment feels basic compared to EV startups",
      "High dealer markups and limited availability",
    ],
    tagline: "The best of both worlds: plug-in efficiency and SUV utility.",
    description:
      "Offering 42 miles of electric-only driving for commutes and a combined 600-mile range for road trips, the RAV4 Prime is the practical hybrid that requires zero compromises.",
  },
  {
    id: "mazda-mx-5",
    make: "Mazda",
    model: "MX-5 Miata Club",
    year: 2026,
    price: 2750000,
    type: "Coupe",
    fuelType: "Gas",
    image: "/cars/mazda-mx-5.png",
    specs: {
      zeroToSixty: "5.7s",
      topSpeed: "135 mph",
      power: "181 hp",
      rangeOrMpg: "26 / 34 mpg",
      cargoSpace: "4.5 cu ft",
    },
    metrics: {
      performance: 8,
      efficiency: 6,
      utility: 2,
      value: 9,
      comfort: 5,
    },
    bestUseCases: ["Weekend Fun", "Track & Performance", "Commuting"],
    keyFeatures: [
      "Kinematic Posture Control",
      "Brembo/BBS Recaro Package",
      "Manual Soft Top",
      "Limited-Slip Differential",
    ],
    pros: [
      "Pure, visceral driving feedback",
      "Lightweight and highly responsive",
      "Affordable maintenance and entry cost",
    ],
    cons: [
      "Tiny trunk and cabin storage",
      "Noisy highway ride",
      "Impractical for carrying passengers or cargo",
    ],
    tagline: "Pure sports car joy at an accessible price.",
    description:
      "The Miata remains the benchmark for analog driving purity. With a featherweight chassis, snappy manual shifter, and rear-wheel drive, it delivers unmatched smiles-per-mile.",
  },
  {
    id: "rivian-r1s",
    make: "Rivian",
    model: "R1S Dual-Motor Max Pack",
    year: 2026,
    price: 7600000,
    type: "SUV",
    fuelType: "Electric",
    image: "/cars/rivian-r1s.png",
    specs: {
      zeroToSixty: "3.4s",
      topSpeed: "125 mph",
      power: "665 hp",
      rangeOrMpg: "410 mi (EPA)",
      cargoSpace: "104.7 cu ft",
    },
    metrics: {
      performance: 9,
      efficiency: 7,
      utility: 10,
      value: 6,
      comfort: 9,
    },
    bestUseCases: ["Off-Road Adventuring", "Family Road Trips", "Towing"],
    keyFeatures: [
      "Quad-Motor/Dual-Motor AWD",
      'Adjustable Air Suspension (14.9" clearance)',
      "Gear Guard security",
      "Three-Row Seating",
    ],
    pros: [
      "Incredible off-road capability",
      "Luxurious and spacious interior",
      "Outstanding range (410 mi)",
    ],
    cons: [
      "Large and heavy for tight city streets",
      "Expensive base price",
      "Stiffer ride than soft luxury crossovers",
    ],
    tagline: "Adventure-ready electric utility without compromise.",
    description:
      "The Rivian R1S combines true off-road capability (wading depth of 3+ feet) with high-end supercar acceleration and 3-row convenience. An electric vehicle designed for the great outdoors.",
  },
  {
    id: "honda-civic",
    make: "Honda",
    model: "Civic Sport Hybrid",
    year: 2026,
    price: 2450000,
    type: "Sedan",
    fuelType: "Hybrid",
    image: "/cars/honda-civic.png",
    specs: {
      zeroToSixty: "6.2s",
      topSpeed: "125 mph",
      power: "200 hp",
      rangeOrMpg: "50 / 43 mpg",
      cargoSpace: "14.8 cu ft",
    },
    metrics: {
      performance: 6,
      efficiency: 10,
      utility: 6,
      value: 10,
      comfort: 7,
    },
    bestUseCases: ["Daily Commute", "Budget Driving", "Urban Commuting"],
    keyFeatures: [
      "Dual-Motor Hybrid System",
      "Honda Sensing Suite",
      "Digital Instrument Display",
      "Apple CarPlay/Android Auto",
    ],
    pros: [
      "Phenomenal fuel economy (50 MPG)",
      "Comfortable, well-damped ride",
      "High resale value and reliability",
    ],
    cons: [
      "Road noise at highway speeds",
      "No AWD option",
      "Plentiful hard plastics in lower trims",
    ],
    tagline: "The gold standard of compact cars is now hybrid by default.",
    description:
      "The Civic Hybrid pairs a refined interior and sporty ride with a highly efficient hybrid system that returns up to 50 MPG. It is the smart, low-maintenance choice for budget-conscious commuters.",
  },
  {
    id: "hyundai-ioniq-5-n",
    make: "Hyundai",
    model: "Ioniq 5 N",
    year: 2026,
    price: 5600000,
    type: "Hatchback",
    fuelType: "Electric",
    image: "/cars/hyundai-ioniq-5-n.png",
    specs: {
      zeroToSixty: "3.2s",
      topSpeed: "162 mph",
      power: "641 hp",
      rangeOrMpg: "221 mi (EPA)",
      cargoSpace: "27.2 cu ft",
    },
    metrics: {
      performance: 10,
      efficiency: 6,
      utility: 7,
      value: 8,
      comfort: 8,
    },
    bestUseCases: ["Track & Performance", "Weekend Fun", "Daily Commute"],
    keyFeatures: [
      "N e-Shift (Simulated Dual-Clutch)",
      "N Active Sound+",
      "Drift Optimizer",
      "800V Ultra-Fast Charging",
    ],
    pros: [
      "The most fun electric car on the market",
      "Stunning retro-modern styling",
      "Superb track durability",
    ],
    cons: [
      "Mediocre highway range (221 mi)",
      "Aggressive bucket seats can feel tight",
      "Firm suspension even in comfort mode",
    ],
    tagline: "An electric vehicle that speaks the enthusiast language.",
    description:
      "The Ioniq 5 N is a revolutionary performance EV. Using software to simulate a dual-clutch transmission and combustion engine noises, it delivers a deeply interactive driving experience that rivals high-end sports cars.",
  },
  {
    id: "ford-f150-lightning",
    make: "Ford",
    model: "F-150 Lightning Flash",
    year: 2026,
    price: 5800000,
    type: "Truck",
    fuelType: "Electric",
    image: "/cars/ford-f150-lightning.png",
    specs: {
      zeroToSixty: "4.1s",
      topSpeed: "110 mph",
      power: "580 hp",
      rangeOrMpg: "320 mi (EPA)",
      cargoSpace: "14.1 cu ft (Mega Power Frunk)",
    },
    metrics: {
      performance: 7,
      efficiency: 7,
      utility: 10,
      value: 7,
      comfort: 8,
    },
    bestUseCases: ["Heavy Utility", "Work & Site Power", "Family Road Trips"],
    keyFeatures: [
      "9.6kW Pro Power Onboard",
      "Mega Power Frunk",
      "BlueCruise Hands-Free Driving",
      "Electronic AWD",
    ],
    pros: [
      "Powers tools or your whole home",
      "Massive utility and dry storage in the frunk",
      "Insanely fast for a full-size truck",
    ],
    cons: [
      "Towing heavily cuts range by 50%",
      "Challenging to park in urban garages",
      "Charging large battery takes time on slower chargers",
    ],
    tagline: "The truck of the future, powered by electricity.",
    description:
      "The F-150 Lightning is a workhorse first and an EV second. It retains everything that makes the F-150 the best-selling truck in America, adding unmatched power export capability and massive closed dry storage.",
  },
  {
    id: "bmw-m3-competition",
    make: "BMW",
    model: "M3 Competition xDrive",
    year: 2026,
    price: 7200000,
    type: "Sedan",
    fuelType: "Gas",
    image: "/cars/bmw-m3-competition.png",
    specs: {
      zeroToSixty: "3.4s",
      topSpeed: "180 mph",
      power: "503 hp",
      rangeOrMpg: "16 / 22 mpg",
      cargoSpace: "13.0 cu ft",
    },
    metrics: {
      performance: 9,
      efficiency: 4,
      utility: 5,
      value: 6,
      comfort: 8,
    },
    bestUseCases: ["Track & Performance", "Daily Commute", "Weekend Fun"],
    keyFeatures: [
      "xDrive Performance AWD",
      "M Adaptive Suspension",
      "M Drive Professional Telemetry",
      "Live Cockpit Professional",
    ],
    pros: [
      "Supercar performance in a daily sedan",
      "Incredible all-weather grip",
      "Premium tech and ergonomics",
    ],
    cons: [
      "Firm ride over potholes",
      "Controversial front grille design",
      "Very high fuel and service costs",
    ],
    tagline: "The legendary benchmark for sports sedans.",
    description:
      "The BMW M3 remains the absolute standard for dual-purpose vehicles. It can tear up race tracks on the weekend and comfortably carry four adults to dinner during the week.",
  },
  {
    id: "subaru-outback-wilderness",
    make: "Subaru",
    model: "Outback Wilderness",
    year: 2026,
    price: 3450000,
    type: "SUV",
    fuelType: "Gas",
    image: "/cars/subaru-outback-wilderness.png",
    specs: {
      zeroToSixty: "5.8s",
      topSpeed: "115 mph",
      power: "260 hp",
      rangeOrMpg: "21 / 26 mpg",
      cargoSpace: "32.6 cu ft",
    },
    metrics: {
      performance: 6,
      efficiency: 5,
      utility: 9,
      value: 8,
      comfort: 9,
    },
    bestUseCases: [
      "Off-Road Adventuring",
      "Family Road Trips",
      "All-Weather Adventuring",
    ],
    keyFeatures: [
      '9.5" Ground Clearance',
      "Symmetrical AWD with Dual X-Mode",
      "All-terrain Yokohamas",
      "StarTex Water-Repellent Seats",
    ],
    pros: [
      "Exceptional ride comfort on dirt/potholes",
      "Very capable in snow and mud",
      "Robust roof rails and utility design",
    ],
    cons: [
      "CVT transmission lacks engagement",
      "Fuel economy is subpar for a wagon",
      "Vertical touchscreen is slow to boot up",
    ],
    tagline: "Built for the rugged outdoors, comfortable for the highway.",
    description:
      "With raised suspension, aggressive all-terrain tires, and water-resistant materials inside, the Outback Wilderness is ready for rugged trails while retaining the plush comfort of a family cruiser.",
  },
];

interface DatasetCar {
  car_id: number;
  brand: string;
  model: string;
  year: number;
  price_ex_showroom: number;
  horsepower: number;
  fuel_type: string;
  transmission: string;
  mileage_combined: number;
  seating_capacity: number;
  boot_space: number;
  ground_clearance: number;
  safety_rating: number;
  airbags_count: number;
  body_type: string;
  abs: string;
  rear_camera: string;
  sunroof: string;
}

const toScore = (value: number, min: number, max: number): number =>
  Math.max(1, Math.min(10, Math.round(1 + ((value - min) / (max - min)) * 9)));

const datasetToCar = (car: DatasetCar): Car => {
  const performance = toScore(car.horsepower, 100, 400);
  const efficiency = toScore(car.mileage_combined, 10, 25);
  const utility = toScore(
    car.boot_space + car.seating_capacity * 100,
    500,
    1600,
  );
  const value = toScore(3000000 - car.price_ex_showroom, -12000000, 2000000);
  const comfort = toScore(
    car.seating_capacity * 100 + (car.rear_camera === "True" ? 100 : 0),
    400,
    1200,
  );

  return {
    id: `dataset-${car.car_id}`,
    make: car.brand,
    model: car.model,
    year: car.year,
    price: car.price_ex_showroom,
    type: car.body_type as Car["type"],
    fuelType: car.fuel_type as Car["fuelType"],
    image: "",
    specs: {
      zeroToSixty: "N/A",
      topSpeed: "N/A",
      power: `${car.horsepower} hp`,
      rangeOrMpg: `${car.mileage_combined} km/l`,
      cargoSpace: `${car.boot_space} L`,
    },
    metrics: { performance, efficiency, utility, value, comfort },
    bestUseCases: [
      `${car.seating_capacity}-seat travel`,
      `${car.body_type} driving`,
    ],
    keyFeatures: [
      `${car.transmission} transmission`,
      `${car.safety_rating}/5 safety rating`,
      `${car.airbags_count} airbags`,
    ],
    pros: [
      `${car.horsepower} hp output`,
      `${car.mileage_combined} km/l combined mileage`,
      car.rear_camera === "True" ? "Rear camera" : "Parking sensors",
    ],
    cons: [
      `${car.ground_clearance} mm ground clearance`,
      car.abs === "True"
        ? "No listed advanced driver assistance"
        : "ABS unavailable",
      car.sunroof === "True"
        ? "Sunroof availability varies by variant"
        : "No sunroof listed",
    ],
    tagline: `${car.brand} ${car.model}, calibrated from the AutoMatch dataset.`,
    description: `${car.brand} ${car.model} is a ${car.year} ${car.body_type} with ${car.horsepower} hp, ${car.mileage_combined} km/l combined mileage, and ${car.seating_capacity} seats.`,
  };
};

export const carsDatabase: Car[] = (rawCars as DatasetCar[]).map(datasetToCar);

export function getRecommendations(
  preferences: UserPreferences,
): { car: Car; matchPercentage: number }[] {
  const { budget, types, fuels, metrics: userMetrics } = preferences;

  const results = carsDatabase.map((car) => {
    // 1. Check strict conditions & apply soft penalty for budget
    let budgetPenalty = 0;
    if (car.price > budget) {
      const diff = car.price - budget;
      const percentOver = diff / budget;
      // If it is > 20% over budget, filter it or reduce score heavily
      if (percentOver > 0.2) {
        budgetPenalty = 50; // Massively lower score
      } else {
        budgetPenalty = (percentOver / 0.2) * 25; // Soft penalty up to 25 points
      }
    }

    // 2. Type Match (SUV, Sedan, etc.)
    let typeBonus = 0;
    if (types.length > 0) {
      if (types.includes(car.type)) {
        typeBonus = 5; // Preference match bonus
      } else {
        typeBonus = -15; // Penalty for wrong body style
      }
    }

    // 3. Fuel Match (Electric, Hybrid, Gas)
    let fuelBonus = 0;
    if (fuels.length > 0) {
      if (fuels.includes(car.fuelType)) {
        fuelBonus = 5;
      } else {
        fuelBonus = -15;
      }
    }

    // 4. Metric Compatibility Score
    // Calculate weighted distance
    let diffSum = 0;
    let weightSum = 0;

    const keys = Object.keys(userMetrics) as (keyof typeof userMetrics)[];

    keys.forEach((key) => {
      // User preference is 1-10. Car metric is 1-10.
      const userVal = userMetrics[key]; // Importance or preference (1-10)
      const carVal = car.metrics[key];

      // Weight is based on how important the user rated it (higher rating = higher weight in matching)
      const weight = userVal >= 7 ? 2 : userVal <= 3 ? 0.5 : 1;

      // Calculate how close the car is to the user's rating.
      // If user rated high, they want high metrics. If they rated low, it matters less.
      // But let's say the absolute difference represents the mismatch.
      const diff = Math.abs(userVal - carVal);

      diffSum += diff * weight;
      weightSum += weight;
    });

    const averageDiff = diffSum / weightSum; // Range: 0 to 9
    // Convert to a base score out of 100
    const baseCompatibility = 100 - averageDiff * 8; // 0 diff = 100, 9 diff = 28

    // Combine calculations
    let finalScore = baseCompatibility + typeBonus + fuelBonus - budgetPenalty;

    // Clamp between 0 and 100
    finalScore = Math.max(0, Math.min(100, finalScore));

    // Clean up rounding
    const matchPercentage = Math.round(finalScore);

    return {
      car,
      matchPercentage,
    };
  });

  // Sort by match percentage (descending) and then price (ascending)
  return results.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    return a.car.price - b.car.price;
  });
}
