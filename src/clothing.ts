import type { Item, ClothingData } from './domain';

export type ClothingRecognitionResult = ClothingData & { explanation?: string };
export type OutfitSuggestionInput = { clothingItems: Item[]; weather: { city?: string; temperature?: number; condition?: string }; scene: string; goal: string; astrology?: { sign: string; fortune?: string } };
export type OutfitSuggestion = { itemIds: string[]; explanation: string; weatherReason: string; sceneReason: string; styleReason: string; astrologyReason?: string };
export type ClothingAIService = { removeBackground(imageUri: string): Promise<{ cutoutUri: string }>; recognize(imageUri: string): Promise<ClothingRecognitionResult>; generateOutfitSuggestion(input: OutfitSuggestionInput): Promise<OutfitSuggestion>; generateTryOn(input: { itemIds: string[]; personImageUri: string }): Promise<{ imageUri: string }> };

export function clothingItems(items: Item[]) { return items.filter(item => item.categoryId === 'clothes'); }
export function filterClothing(items: Item[], filter: { subcategory?: string; style?: string; season?: string; color?: string; status?: ClothingData['recognitionStatus'] }) {
  return clothingItems(items).filter(item => {
    const data = item.clothing ?? {};
    return (!filter.subcategory || data.subcategory === filter.subcategory) && (!filter.style || data.styleTags?.includes(filter.style)) && (!filter.season || data.seasonTags?.includes(filter.season)) && (!filter.color || data.colors?.includes(filter.color)) && (!filter.status || data.recognitionStatus === filter.status);
  });
}
export async function suggestOutfit(input: OutfitSuggestionInput): Promise<OutfitSuggestion> {
  const selected = input.clothingItems.slice(0, 3);
  const names = selected.map(item => item.name).join('、') || '现有衣物';
  return { itemIds: selected.map(item => item.id), explanation: `建议使用${names}，形成适合${input.scene}的搭配。`, weatherReason: `根据${input.weather.temperature ?? '当前'}°C、${input.weather.condition ?? '当前天气'}进行选择。`, sceneReason: `满足${input.scene}场景并兼顾${input.goal}目标。`, styleReason: '优先组合衣橱中已确认的风格标签。', ...(input.astrology?.sign ? { astrologyReason: `${input.astrology.sign}：${input.astrology.fortune ?? '适合保持轻松自然的搭配。'}` } : {}) };
}
export const mockClothingAI: ClothingAIService = {
  async removeBackground(imageUri) { return { cutoutUri: `${imageUri}#cutout` }; },
  async recognize() { return { subcategory: '上衣', styleTags: ['日常'], colors: ['中性色'], seasonTags: ['四季'] }; },
  async generateOutfitSuggestion(input) { return suggestOutfit(input); },
  async generateTryOn(input) { return { imageUri: `mock://try-on/${input.itemIds.join('-')}` }; },
};
