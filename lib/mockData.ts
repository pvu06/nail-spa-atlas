export interface Competitor {
  id: string;
  name: string;
  website: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  samplePrices: {
    gel: number;
    pedicure: number;
    acrylic: number;
  };
  staffBand: string;
  hoursPerWeek: number;
  amenities: string[];
  distanceMiles: number;
}

export const competitors: Competitor[] = [
  {
    id: "1",
    name: "Glamour Nails & Spa",
    website: "https://glamournails.com",
    rating: 4.5,
    reviewCount: 220,
    priceRange: "$$",
    samplePrices: { gel: 35, pedicure: 40, acrylic: 55 },
    staffBand: "4–7",
    hoursPerWeek: 60,
    amenities: ["Wi-Fi", "Wheelchair Accessible", "Appointment Required"],
    distanceMiles: 1.2
  },
  {
    id: "2",
    name: "Luxury Spa Nails",
    website: "https://luxurynails.com",
    rating: 4.0,
    reviewCount: 180,
    priceRange: "$$$",
    samplePrices: { gel: 45, pedicure: 50, acrylic: 70 },
    staffBand: "8+",
    hoursPerWeek: 65,
    amenities: ["Credit Card", "Walk-ins Welcome"],
    distanceMiles: 0.9
  },
  {
    id: "3",
    name: "Pretty Hands",
    website: "https://prettyhands.com",
    rating: 3.8,
    reviewCount: 95,
    priceRange: "$$",
    samplePrices: { gel: 30, pedicure: 35, acrylic: 50 },
    staffBand: "1–3",
    hoursPerWeek: 55,
    amenities: ["Parking", "Cash Only"],
    distanceMiles: 1.5
  },
  {
    id: "4",
    name: "Star Beauty Nails",
    website: "https://starbeauty.com",
    rating: 4.7,
    reviewCount: 310,
    priceRange: "$$$",
    samplePrices: { gel: 40, pedicure: 45, acrylic: 65 },
    staffBand: "8+",
    hoursPerWeek: 70,
    amenities: ["Wi-Fi", "Luxury Chairs", "Beverages"],
    distanceMiles: 0.6
  },
  {
    id: "5",
    name: "Cozy Nails",
    website: "https://cozynails.com",
    rating: 4.2,
    reviewCount: 130,
    priceRange: "$",
    samplePrices: { gel: 25, pedicure: 30, acrylic: 45 },
    staffBand: "4–7",
    hoursPerWeek: 50,
    amenities: ["Family Friendly", "Walk-ins Welcome"],
    distanceMiles: 2.0
  }
];

// Utility functions for chart calculations
export function calculateValueIndex(competitor: Competitor): number {
  const priceMultiplier = competitor.priceRange === "$" ? 3 : competitor.priceRange === "$$" ? 2 : 1;
  return (competitor.rating * Math.log(1 + competitor.reviewCount)) / priceMultiplier;
}

export function calculateStaffScore(staffBand: string): number {
  if (staffBand === "1–3") return 1;
  if (staffBand === "4–7") return 2;
  return 3;
}

export function calculateAmenityScore(amenities: string[]): number {
  return Math.min(amenities.length / 5, 1);
}

export function getChartData() {
  return competitors.map(comp => ({
    name: comp.name.split(' ')[0], // Short name for chart
    rating: comp.rating,
    valueIndex: Number(calculateValueIndex(comp).toFixed(1)),
    staffScore: calculateStaffScore(comp.staffBand),
    amenityScore: Number((calculateAmenityScore(comp.amenities) * 5).toFixed(1))
  }));
}

export function getPriceChartData() {
  return competitors.map(comp => ({
    name: comp.name.split(' ')[0],
    gel: comp.samplePrices.gel,
    pedicure: comp.samplePrices.pedicure,
    acrylic: comp.samplePrices.acrylic
  }));
}

