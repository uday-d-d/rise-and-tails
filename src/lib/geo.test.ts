import { describe, expect, it } from "vitest";
import { haversineKm, isWithinRadius } from "./geo";

const center = { lat: 19.076, lng: 72.8777 }; // Mumbai city centre

describe("25 km service radius", () => {
  it("accepts a location ~10 km away", () => {
    const p = { lat: 19.166, lng: 72.8777 };
    expect(haversineKm(center, p)).toBeGreaterThan(9);
    expect(isWithinRadius(center, p)).toBe(true);
  });
  it("rejects a location ~30 km away", () => {
    const p = { lat: 19.346, lng: 72.8777 };
    expect(haversineKm(center, p)).toBeGreaterThan(29);
    expect(isWithinRadius(center, p)).toBe(false);
  });
});
