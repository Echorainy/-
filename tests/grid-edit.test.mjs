import test from 'node:test';
import assert from 'node:assert/strict';
import { cellAt, paintCells, validateCells } from '../src/grid-edit.ts';

test('grid coordinates reject overflow and map edge cells', () => {
  assert.deepEqual([[0,0], [319,319], [40,0], [0,40], [-1,0], [320,0], [0,320]].map(([x,y]) => cellAt(x,y,320)), [0,63,1,8,null,null,null]);
});
test('painting and erasing are idempotent and protect occupied cells', () => {
  const blocked = new Set([2]);
  assert.deepEqual(paintCells([1],1,true,blocked), [1]);
  assert.deepEqual(paintCells([1],2,true,blocked), [1]);
  assert.deepEqual(paintCells([1,3],1,false,blocked), [3]);
});
test('layout validation protects direct siblings but permits nested content', () => {
  const containers = [{id:'a',roomId:'r',cells:[0]}, {id:'b',roomId:'r',cells:[1]}, {id:'nested',roomId:'r',parentId:'a',cells:[3]}];
  const items = [{roomId:'r',cell:2}, {roomId:'r',containerId:'a',cell:4}];
  for (const cells of [[], [-1], [64], [1.5], [1], [2]]) assert.ok(validateCells('a',cells,containers,items));
  assert.ok(validateCells('missing',[0],containers,items));
  assert.equal(validateCells('a',[0,3,4],containers,items),null);
});
