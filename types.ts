export interface IngredientDetail {
  name: string;
  risk: 'SAFE' | 'CAUTION' | 'DANGER';
  reason?: string;
}

export interface HealthyReport {
  productName: string;
  barcode: string | null;
  product_image?: string;
  score: number; // 0 to 100
  sugar_g: number | null;
  protein_g: number | null;
  ingredients: IngredientDetail[];
  nutritional_analysis: string;
  verdict: string;
}

export enum AppView {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  REPORT = 'REPORT',
}

export interface UserSettings {
  geminiApiKey: string;
}