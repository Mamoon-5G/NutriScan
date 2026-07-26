export interface IngredientDetail {
  code: string;
  name: string;
  category: string;
  description: string;
  why_harmful: string;
  health_effects: string[];
  environmental_impact: string;
  usage: string;
  risk_level: string;
  alternatives: string;
}

export interface UnifiedScore {
  overall_eco_score: 'High' | 'Moderate' | 'Low';
  health_score: 'High' | 'Moderate' | 'Low';
  confidence: number;
}

export interface ProductData {
  product_name?: string;
  brands?: string;
  image_url?: string;
  nutrition_grade?: string;
  ecoscore_grade?: string;
  ingredients_text?: string;
  harmful_ingredients?: string[];
  harmful_ingredients_details?: IngredientDetail[];
  allergens?: string;
  nova_group?: number;
  rule_based_health_label?: number;
  ml_health_label?: number | string;
  environmental_impact?: string;
  labels?: {
    health_label?: number;
    eco_label?: number;
  };
  ml_features?: Record<string, number>;
  unified_score?: UnifiedScore;
}
