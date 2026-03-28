import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADDITIVES_URL = 'https://world.openfoodfacts.org/data/taxonomies/additives.json';
const OUTPUT_PATH = path.join(__dirname, 'data', 'additives.json');

async function fetchAndPopulateAdditives() {
    console.log('Fetching additives from OpenFoodFacts...');

    try {
        const { data: rawData } = await axios.get(ADDITIVES_URL);
        console.log(`Successfully fetched taxonomy. Parsing ${Object.keys(rawData).length} entries...`);

        // We only want actual base additives (e.g. en:e100), not sub-variants or categories if possible
        const formattedAdditives = {};

        for (const [key, value] of Object.entries(rawData)) {
            if (!key.startsWith('en:e') || !key.match(/^en:e\d+[a-z]?$/i)) continue;

            const code = key.replace('en:', '').toLowerCase(); // e.g. "e100"

            // Extract English name or fallback
            const name = value.name?.en || value.name?.fr || `Unknown Additive (${code.toUpperCase()})`;

            // Try to determine risk level based on EFSA evals or Wikipedia descriptions if available
            // Or just default to Unknown
            let efsaOverexposureRisk = "Unknown";
            if (value.efsa_evaluation_overexposure_risk?.en) {
                efsaOverexposureRisk = value.efsa_evaluation_overexposure_risk.en;
            }

            let risk_level = "Unknown";
            if (efsaOverexposureRisk.toLowerCase().includes('high') || value.efsa_evaluation_safety_assessment?.en?.toLowerCase().includes('not safe')) {
                risk_level = "High";
            } else if (efsaOverexposureRisk.toLowerCase().includes('moderate')) {
                risk_level = "Moderate";
            } else if (efsaOverexposureRisk.toLowerCase().includes('no')) {
                risk_level = "Low";
            }

            // Add to our formatted object
            formattedAdditives[code] = {
                name: name,
                category: value.classes?.en || "Food Additive",
                description: value.wikipedia?.en ? `Wikipedia: ${value.wikipedia.en}` : (value.description?.en || "Used as a food additive."),
                health_effects: [
                    value.efsa_evaluation_safety_assessment?.en ? `Safety: ${value.efsa_evaluation_safety_assessment.en}` : "Limited safety data available",
                    value.efsa_evaluation_overexposure_risk?.en ? `Overexposure Risk: ${value.efsa_evaluation_overexposure_risk.en}` : "Overexposure risk unknown"
                ],
                why_harmful: efsaOverexposureRisk !== "Unknown" ? `EFSA Overexposure Risk: ${efsaOverexposureRisk}` : "Specific harm data not available",
                environmental_impact: "Unknown", // Standard taxonomy doesn't track environmental impact well
                usage: "Various processed foods",
                risk_level: risk_level,
                alternatives: "Consult food labels for specific alternatives"
            };
        }

        // Keep the existing ones that map perfectly with rich data, just merge the taxonomy on top (or vice versa)
        let existingData = {};
        if (fs.existsSync(OUTPUT_PATH)) {
            existingData = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
        }

        // Our existing rich data takes precedence because we painstakingly wrote it
        const finalData = { ...formattedAdditives, ...existingData };

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalData, null, 2));
        console.log(`✅ Successfully saved ${Object.keys(finalData).length} additives to ${OUTPUT_PATH}!`);
        console.log(`Original custom additives: ${Object.keys(existingData).length}`);
        console.log(`New taxonomy additives: ${Object.keys(formattedAdditives).length}`);

    } catch (error) {
        console.error('❌ Failed to fetch and parse additives:', error.message);
    }
}

fetchAndPopulateAdditives();
