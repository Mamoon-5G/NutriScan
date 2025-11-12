import fs from "fs";
import path from "path";
import csv from "csv-parser";

let impactData = [];

// Absolute path to the CSV file
const csvPath = path.resolve("./data/agribalyse.csv");

// ✅ Load the CSV dataset once at server startup
fs.createReadStream(csvPath)
  .pipe(csv())
  .on("data", (row) => {
    impactData.push({
      material: row.material?.toLowerCase().trim() || "",
      co2: parseFloat(row.co2) || 0,
      water: parseFloat(row.water) || 0,
      waste: parseFloat(row.waste) || 0,
    });
  })
  .on("end", () => {
    console.log(`✅ Environmental Impact Data Loaded (${impactData.length} rows)`);
  })
  .on("error", (err) => {
    console.error("❌ Error reading environmental impact CSV:", err);
  });

/**
 * Get environmental impact data for a given product name.
 * @param {string} productName - Name of the product (e.g., "Coca-Cola Can")
 * @returns {object|null} - Matching environmental impact data or null if not found.
 */
export const getEnvironmentalImpact = (productName = "") => {
  if (!productName || typeof productName !== "string") {
    console.warn("⚠️ Invalid productName provided:", productName);
    return null;
  }

  const name = productName.toLowerCase();

  // Try to find a match where the product name includes a known material
  const found = impactData.find((item) => name.includes(item.material));
  if (!found) {
    console.warn(`⚠️ No environmental data found for: ${productName}`);
    return null;
  }

  return {
    material: found.material,
    co2: found.co2,
    water: found.water,
    waste: found.waste,
  };
};
