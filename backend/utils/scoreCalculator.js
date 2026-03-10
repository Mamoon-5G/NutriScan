// backend/utils/scoreCalculator.js
// Centralized scoring utility for EcoScan

/**
 * Standardizes all scoring (ML, rule-based, LLM, Open Food Facts) into a unified JSON format.
 * Input: { product, ml_prediction, rule_based_labels, environmentalImpact, confidence }
 * Output: {
 *   overall_eco_score: 'High' | 'Moderate' | 'Low',
 *   health_score: 'High' | 'Moderate' | 'Low',
 *   confidence: number (0-1)
 * }
 */
export function calculateUnifiedScore({
  ml_prediction = {},
  rule_based_labels = {},
  environmentalImpact = '',
  confidence = 1.0
}) {
  // Health score: prefer ML, fallback to rule-based
  let healthScore = 'Moderate';
  if (ml_prediction.ml_health_label === 2 || rule_based_labels.health_label === 2) healthScore = 'High';
  else if (ml_prediction.ml_health_label === 1 || rule_based_labels.health_label === 1) healthScore = 'Moderate';
  else if (ml_prediction.ml_health_label === 0 || rule_based_labels.health_label === 0) healthScore = 'Low';

  // Eco score: parse environmentalImpact or rule-based
  let ecoScore = 'Moderate';
  if (typeof environmentalImpact === 'string') {
    if (/high/i.test(environmentalImpact)) ecoScore = 'High';
    else if (/low/i.test(environmentalImpact)) ecoScore = 'Low';
    else if (/moderate/i.test(environmentalImpact)) ecoScore = 'Moderate';
  } else if (rule_based_labels.eco_label !== undefined) {
    if (rule_based_labels.eco_label === 2) ecoScore = 'High';
    else if (rule_based_labels.eco_label === 1) ecoScore = 'Moderate';
    else if (rule_based_labels.eco_label === 0) ecoScore = 'Low';
  }

  return {
    overall_eco_score: ecoScore,
    health_score: healthScore,
    confidence: typeof confidence === 'number' ? confidence : 1.0
  };
}
