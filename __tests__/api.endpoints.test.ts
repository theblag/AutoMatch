/**
 * @jest-environment node
 */

// Mock Neon DB so tests can execute reliably in isolated CI/CD environments
jest.mock("@/lib/db", () => {
  const mockSql: any = jest.fn().mockImplementation(async (strings: any, ...values: any[]) => {
    return [];
  });
  return { sql: mockSql };
});

// Mock getSessionUser for unauthenticated / guest mode testing
jest.mock("@/lib/auth", () => ({
  getSessionUser: jest.fn().mockResolvedValue(null),
  createSessionToken: jest.fn().mockResolvedValue("mock-jwt-session-token"),
  verifySessionToken: jest.fn().mockResolvedValue(null),
}));

import { GET as getRecommendations } from "@/app/api/recommendations/route";
import { POST as postInteraction } from "@/app/api/telemetry/interaction/route";
import { POST as postSearchTelemetry } from "@/app/api/telemetry/search/route";
import { POST as postGoogleAuth } from "@/app/api/auth/google/route";
import { POST as postNeonSync } from "@/app/api/auth/neon-sync/route";

describe("API Endpoints Test Suite", () => {
  describe("GET /api/recommendations", () => {
    it("should return default 7D vector recommendations for guest user", async () => {
      const req = new Request("http://localhost:3000/api/recommendations");
      const res = await getRecommendations(req);

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(data.recommendations.length).toBeGreaterThan(0);
      expect(data.vector).toBeDefined();
      expect(data.totalMatches).toBeGreaterThan(1000);

      // Verify structure of first recommended vehicle
      const firstCar = data.recommendations[0];
      expect(firstCar.car).toBeDefined();
      expect(firstCar.car.id).toBeDefined();
      expect(firstCar.car.make).toBeDefined();
      expect(typeof firstCar.matchPercentage).toBe("number");
      expect(firstCar.matchPercentage).toBeGreaterThanOrEqual(50);
      expect(firstCar.matchPercentage).toBeLessThanOrEqual(100);
      expect(Array.isArray(firstCar.explanationBadges)).toBe(true);
    });

    it("should filter recommendations by budget ceiling", async () => {
      const maxBudget = 1000000; // 10 Lakhs
      const req = new Request(`http://localhost:3000/api/recommendations?budget=${maxBudget}`);
      const res = await getRecommendations(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recommendations.length).toBeGreaterThan(0);

      // Verify no returned vehicle exceeds budget + 35% tolerance
      for (const item of data.recommendations) {
        expect(item.car.price).toBeLessThanOrEqual(maxBudget * 1.35);
      }
    });

    it("should filter recommendations by fuel type", async () => {
      const req = new Request("http://localhost:3000/api/recommendations?fuels=Diesel");
      const res = await getRecommendations(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recommendations.length).toBeGreaterThan(0);

      for (const item of data.recommendations) {
        expect(item.car.fuelType.toLowerCase()).toContain("diesel");
      }
    });

    it("should filter recommendations by vehicle body type", async () => {
      const req = new Request("http://localhost:3000/api/recommendations?types=SUV");
      const res = await getRecommendations(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.recommendations.length).toBeGreaterThan(0);

      for (const item of data.recommendations) {
        expect(item.car.type.toUpperCase()).toBe("SUV");
      }
    });
  });

  describe("POST /api/telemetry/interaction", () => {
    it("should reject invalid requests missing required fields with 400", async () => {
      const req = new Request("http://localhost:3000/api/telemetry/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId: "123" }), // missing actionType
      });

      const res = await postInteraction(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("should calculate adapted vector using Exponential Moving Average for guest interaction", async () => {
      const initialVector = {
        affordability: 0.5,
        familySafety: 0.5,
        terrainClearance: 0.5,
        urbanAgility: 0.5,
        performancePower: 0.5,
        fuelEfficiency: 0.5,
        techComfort: 0.5,
      };

      // Car with high performance (0.95)
      const carVector = [0.3, 0.4, 0.5, 0.3, 0.95, 0.4, 0.8];

      const req = new Request("http://localhost:3000/api/telemetry/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: "car-sample-1",
          carName: "BMW M2",
          actionType: "LIKE", // lr = 0.25
          carVector,
          currentVector: initialVector,
        }),
      });

      const res = await postInteraction(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.updatedVector).toBeDefined();

      // Expected performance: (0.5 * 0.75) + (0.95 * 0.25) = 0.375 + 0.2375 = 0.6125 ~= 0.613
      expect(data.updatedVector.performancePower).toBeGreaterThan(0.5);
      expect(data.updatedVector.performancePower).toBeCloseTo(0.613, 2);
    });
  });

  describe("POST /api/telemetry/search", () => {
    it("should tune vector toward user search intent keywords", async () => {
      const baseVector = {
        affordability: 0.5,
        familySafety: 0.5,
        terrainClearance: 0.5,
        urbanAgility: 0.5,
        performancePower: 0.5,
        fuelEfficiency: 0.5,
        techComfort: 0.5,
      };

      const req = new Request("http://localhost:3000/api/telemetry/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "mileage economy hybrid",
          filters: {},
          currentVector: baseVector,
        }),
      });

      const res = await postSearchTelemetry(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.updatedVector).toBeDefined();
      // Fuel efficiency should have increased
      expect(data.updatedVector.fuelEfficiency).toBeGreaterThan(0.5);
    });
  });

  describe("POST /api/auth/google", () => {
    it("should return 400 if email or name is missing", async () => {
      const req = new Request("http://localhost:3000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "driver@example.com" }), // missing name
      });

      const res = await postGoogleAuth(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("POST /api/auth/neon-sync", () => {
    it("should return 400 if email is missing", async () => {
      const req = new Request("http://localhost:3000/api/auth/neon-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Driver" }), // missing email
      });

      const res = await postNeonSync(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });
});
