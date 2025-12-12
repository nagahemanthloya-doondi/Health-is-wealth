export interface OFFProductData {
  product_name?: string;
  brands?: string;
  ingredients_text?: string;
  image_url?: string;
  nutriments?: {
    [key: string]: number;
  };
}

export const fetchProductFromOFF = async (barcode: string): Promise<OFFProductData | null> => {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status === 1 && data.product) {
      return {
        product_name: data.product.product_name || data.product.product_name_en,
        brands: data.product.brands,
        ingredients_text: data.product.ingredients_text || data.product.ingredients_text_en,
        image_url: data.product.image_url,
        nutriments: data.product.nutriments
      };
    }
    
    return null;
  } catch (error) {
    console.error("OpenFoodFacts Fetch Error:", error);
    return null;
  }
};