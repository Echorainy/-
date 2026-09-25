import type { Container, Item } from './domain';

export function cellAt(x: number, y: number, width: number): number | null {
  if (![x, y, width].every(Number.isFinite) || width <= 0 || x < 0 || y < 0 || x >= width || y >= width) return null;
  return Math.floor(y * 8 / width) * 8 + Math.floor(x * 8 / width);
}

export function paintCells(cells: number[], cell: number, adding: boolean, blocked: Set<number>) {
  if (blocked.has(cell)) return cells;
  return adding ? [...new Set([...cells, cell])] : cells.filter(c => c !== cell);
}

export function validateCells(id: string, cells: number[], containers: Container[], items: Item[]): string | null {
  const target = containers.find(c => c.id === id);
  if (!target) return '模块不存在';
  if (!cells.length) return '请至少选择一个格子';
  if (cells.some(c => !Number.isInteger(c) || c < 0 || c > 63)) return '格子编号无效';
  const blocked = new Set(containers.filter(c => c.id !== id && c.roomId === target.roomId && c.parentId === target.parentId).flatMap(c => c.cells));
  items.filter(i => i.roomId === target.roomId && i.containerId === target.parentId).forEach(i => { if (i.cell !== undefined) blocked.add(i.cell); });
  return cells.some(c => blocked.has(c)) ? '格子已被其他模块或物品占用' : null;
}
