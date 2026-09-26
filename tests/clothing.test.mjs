import test from 'node:test';
import assert from 'node:assert/strict';
import { clothingItems, filterClothing, mockClothingAI, suggestOutfit } from '../src/clothing.ts';

const items = [
  { id: 'top', name: '白衬衫', roomId: 'r', categoryId: 'clothes', reminderDays: 7, clothing: { subcategory: '上衣', styleTags: ['通勤'], colors: ['白色'], seasonTags: ['春秋'] } },
  { id: 'shoe', name: '运动鞋', roomId: 'r', categoryId: 'clothes', reminderDays: 7, clothing: { subcategory: '鞋', styleTags: ['运动'], colors: ['白色'], seasonTags: ['四季'] } },
  { id: 'food', name: '茶', roomId: 'r', categoryId: 'drink', reminderDays: 7 },
];

test('clothing inventory only includes clothing items', () => {
  assert.deepEqual(clothingItems(items).map(item => item.id), ['top', 'shoe']);
});

test('clothing filters by subcategory and style', () => {
  assert.deepEqual(filterClothing(items, { subcategory: '上衣' }).map(item => item.id), ['top']);
  assert.deepEqual(filterClothing(items, { style: '运动' }).map(item => item.id), ['shoe']);
});

test('mock clothing AI returns deterministic recognition and try-on output', async () => {
  const result = await mockClothingAI.recognize('file:///shirt.jpg');
  assert.equal(result.subcategory, '上衣');
  assert.equal(result.recognitionStatus, undefined);
  assert.match((await mockClothingAI.removeBackground('file:///shirt.jpg')).cutoutUri, /shirt/);
  assert.match((await mockClothingAI.generateTryOn({ itemIds: ['top'], personImageUri: 'file:///person.jpg' })).imageUri, /try-on/);
});

test('outfit suggestions explain weather, scene and inventory choices', async () => {
  const result = await suggestOutfit({ clothingItems: items.slice(0, 2), weather: { temperature: 18, condition: '晴天' }, scene: '通勤', goal: '舒适', astrology: { sign: '天秤座', fortune: '适合尝试简洁搭配' } });
  assert.deepEqual(result.itemIds, ['top', 'shoe']);
  assert.match(result.explanation, /白衬衫/);
  assert.match(result.weatherReason, /18/);
  assert.match(result.astrologyReason, /天秤座/);
});
