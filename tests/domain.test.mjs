import test from 'node:test';
import assert from 'node:assert/strict';
import { remainingDays, statistics, homeItems, locationPath, validateName, directChildren, directItems } from '../src/domain.ts';

const now = new Date(2026, 8, 24, 23, 59);
const dates = ['2026-09-23', '2026-09-24', '2026-10-01', '2026-10-02', '2026-10-24', '2026-10-25', undefined];
const items = dates.map((expiry, i) => ({ id: String(i), roomId: 'kitchen', categoryId: 'food', name: '茶', expiry, reminderDays: 7 }));
const homes = [{ id: 'a', name: '我的家' }, { id: 'b', name: '另一个家' }];
const rooms = [{ id: 'kitchen', homeId: 'a', name: '厨房' }, { id: 'b-kitchen', homeId: 'b', name: '厨房' }];
test('calendar boundaries include today, exclude expired from upcoming', () => {
  assert.deepEqual(dates.map(d => remainingDays(d, now)), [-1, 0, 7, 8, 30, 31, null]);
  assert.deepEqual(statistics(items, now), { all: 7, month: 4, week: 2, expired: 1 });
});
test('invalid dates and leap dates', () => {
  assert.equal(remainingDays('2026-02-30', now), null);
  assert.equal(remainingDays('2024-02-29', new Date(2024, 1, 28)), 1);
  assert.equal(remainingDays('2026-09-24', new Date(2026, 8, 25)), -1);
});
test('home filters include descendants via room and permit empty homes', () => {
  const all = [...items, { ...items[0], id: 'other', roomId: 'b-kitchen', containerId: 'drawer' }];
  assert.equal(homeItems(all, rooms, 'a').length, 7);
  assert.equal(homeItems(all, rooms, 'b').length, 1);
  assert.equal(homeItems(all, [], 'a').length, 0);
});
test('paths distinguish homes and children never leak into parent level', () => {
  const modules = [{ id: 'cabinet', roomId: 'kitchen', name: '橱柜' }, { id: 'drawer', roomId: 'kitchen', parentId: 'cabinet', name: '抽屉' }];
  assert.equal(locationPath('kitchen', 'drawer', homes, rooms, modules), '我的家 → 厨房 → 橱柜 → 抽屉');
  assert.equal(locationPath('b-kitchen', undefined, homes, rooms, modules), '另一个家 → 厨房');
  assert.deepEqual(directChildren(modules, 'kitchen', undefined).map(x => x.id), ['cabinet']);
  assert.deepEqual(directChildren(modules, 'kitchen', 'cabinet').map(x => x.id), ['drawer']);
  assert.equal(directItems([{ ...items[0], containerId: 'drawer' }], 'kitchen', undefined).length, 0);
});
test('trimmed names must be unique in their scope', () => {
  assert.ok(validateName('  ', homes));
  assert.ok(validateName(' 我的家 ', homes));
  assert.equal(validateName(' 我的家 ', homes, 'a'), null);
  assert.equal(validateName('新家', homes), null);
});
