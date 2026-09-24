import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeSnapshot, encodeSnapshot, emptySnapshot, migrateSnapshot } from '../src/persistence.ts';

test('encodes and decodes all app collections without losing nested layout data', () => {
  const input = { homes: [{ id: 'h', name: '我的家' }], rooms: [{ id: 'r', homeId: 'h', name: '厨房', layout: { rows: 8, cols: 8 } }], containers: [{ id: 'c', roomId: 'r', name: '橱柜', level: 2, cells: [1, 2] }], items: [{ id: 'i', name: '茶', roomId: 'r', categoryId: 'drink', containerId: 'c', cell: 1, expiry: '2026-09-24', reminderDays: 7 }], categories: [{ id: 'drink', name: '饮品', isSystem: false }] };
  assert.deepEqual(decodeSnapshot(encodeSnapshot(input)), input);
});

test('migrates missing or corrupt snapshots to safe initial data', () => {
  const initial = emptySnapshot();
  assert.deepEqual(migrateSnapshot(undefined), initial);
  assert.deepEqual(migrateSnapshot('{"homes":[]}'), initial);
  assert.deepEqual(migrateSnapshot('{broken'), initial);
  assert.deepEqual(migrateSnapshot('{"rooms":[{"id":"r"}]}').rooms, initial.rooms);
});
