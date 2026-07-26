import { supabase } from "../config/supabase.js";
import logger from "../utils/logger.js";

/**
 * Get product data from the Supabase cache table
 */
export const getProductFromCache = async (barcode) => {
  try {
    const { data, error } = await supabase
      .from("cached_products")
      .select("product_data")
      .eq("barcode", barcode)
      .maybeSingle();

    if (error) {
      logger.error({ error, barcode }, "Failed to fetch cached product from Supabase");
      return null;
    }

    return data?.product_data || null;
  } catch (err) {
    logger.error({ err, barcode }, "Exception reading from Supabase cache");
    return null;
  }
};

/**
 * Save product data to the Supabase cache table
 */
export const saveProductToCache = async (barcode, productData) => {
  try {
    const { error } = await supabase
      .from("cached_products")
      .upsert({ barcode, product_data: productData });

    if (error) {
      logger.error({ error, barcode }, "Failed to save product cache to Supabase");
    }
  } catch (err) {
    logger.error({ err, barcode }, "Exception writing to Supabase cache");
  }
};

/**
 * Save product features and labels to the Supabase training_data table
 */
export const saveToCSV = async (features, labels) => {
  try {
    const { error } = await supabase
      .from("training_data")
      .insert({
        sugar_100g: features.sugar_100g,
        fat_100g: features.fat_100g,
        salt_100g: features.salt_100g,
        fiber_100g: features.fiber_100g,
        protein_100g: features.protein_100g,
        energy_kcal: features.energy_kcal,
        additives_count: features.additives_count,
        nova_group: features.nova_group,
        plastic_packaging: features.plastic_packaging === 1,
        palm_oil: features.palm_oil === 1,
        health_label: labels.health_label,
        eco_label: labels.eco_label
      });

    if (error) {
      logger.error({ error }, "Failed to save training data to Supabase");
    }
  } catch (err) {
    logger.error({ err }, "Exception saving training data to Supabase");
  }
};
