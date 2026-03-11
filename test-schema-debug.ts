import { insertTouristSpotSchema } from './shared/schema.js';

const testData = {
  name: " ",
  country: "  ",
  city: "  ",
  latitude: "0",
  longitude: "0",
  category: "museum" as const,
  description: " ",
  images: []
};

const result = insertTouristSpotSchema.safeParse(testData);
console.log("Result:", JSON.stringify(result, null, 2));
