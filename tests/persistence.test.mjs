import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeSnapshot, encodeSnapshot, emptySnapshot, migrateSnapshot } from '../src/persistence.ts';
import { DEFAULT_MODULE_COLOR, normalizeModuleColor } from '../src/domain.ts';

test('encodes and decodes all app collections without losing nested layout data', () => {
  const input = { homes: [{ id: 'h', name: '我的家', greeting: '今天也要把家照顾好', note: '喵今天好好收纳了吗' }], rooms: [{ id: 'r', homeId: 'h', name: '厨房', layout: { rows: 8, cols: 8 } }], containers: [{ id: 'c', roomId: 'r', name: '橱柜', level: 2, cells: [1, 2] }], items: [{ id: 'i', name: '茶', roomId: 'r', categoryId: 'drink', containerId: 'c', cell: 1, expiry: '2026-09-24', reminderDays: 7 }], categories: [{ id: 'drink', name: '饮品', isSystem: false }] };
  assert.deepEqual(decodeSnapshot(encodeSnapshot(input)), input);
});

test('migrates missing or corrupt snapshots to safe initial data', () => {
  const initial = emptySnapshot();
  assert.deepEqual(migrateSnapshot(undefined), initial);
  assert.deepEqual(migrateSnapshot('{"homes":[]}'), initial);
  assert.deepEqual(migrateSnapshot('{broken'), initial);
  assert.deepEqual(migrateSnapshot('{"rooms":[{"id":"r"}]}').rooms, initial.rooms);
});

test('normalizes duplicate module cells when loading snapshots', () => {
  const snapshot = encodeSnapshot({
    homes: [{ id: 'h', name: '家' }],
    rooms: [{ id: 'r', homeId: 'h', name: '房间', layout: { rows: 8, cols: 8 } }],
    containers: [{ id: 'c', roomId: 'r', name: '模块', level: 2, cells: [4, 4, 5] }],
    items: [],
    categories: [],
  });
  assert.deepEqual(decodeSnapshot(snapshot).containers[0].cells, [4, 5]);
});

test('old snapshots without module colors remain readable with the default color', () => {
  const snapshot = decodeSnapshot(encodeSnapshot({
    homes: [{ id: 'h', name: '家' }],
    rooms: [{ id: 'r', homeId: 'h', name: '房间', layout: { rows: 8, cols: 8 } }],
    containers: [{ id: 'c', roomId: 'r', name: '模块', level: 2, cells: [] }],
    items: [],
    categories: [],
  }));
  assert.equal(normalizeModuleColor(snapshot.containers[0].color), DEFAULT_MODULE_COLOR);
});

test('old snapshots without home copy use default greeting and note', () => {
  const snapshot = decodeSnapshot(JSON.stringify({ homes: [{ id: 'h', name: '家' }], rooms: [], containers: [], items: [], categories: [] }));
  assert.equal(snapshot.homes[0].greeting, '今天也要把家照顾好');
  assert.equal(snapshot.homes[0].note, '喵今天好好收纳了吗');
});
