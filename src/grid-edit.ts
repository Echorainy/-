import type { Container, Item } from './domain';

export function cellAt(x: number, y: number, width: number): number | null {
  if (![x, y, width].every(Number.isFinite) || width <= 0 || x < 0 || y < 0 || x >= width || y >= width) return null;
  return Math.floor(y * 8 / width) * 8 + Math.floor(x * 8 / width);
}

export function cellAtLocal(x: number, y: number, width: number, height = width): number | null {
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0 || x < 0 || y < 0 || x >= width || y >= height) return null;
  return Math.floor(y * 8 / height) * 8 + Math.floor(x * 8 / width);
}
export const cellFromGesture = cellAtLocal;

export function paintCells(cells: number[], cell: number, adding: boolean, blocked: Set<number>) {
  if (blocked.has(cell)) return cells;
  return adding ? [...new Set([...cells, cell])] : cells.filter(c => c !== cell);
}

export function occupiedCells(roomId: string, parentId: string | undefined, containers: Container[], items: Item[], excludedContainerId?: string, excludedItemId?: string) {
  const occupied = new Set(containers
    .filter(c => c.id !== excludedContainerId && c.roomId === roomId && c.parentId === parentId)
    .flatMap(c => c.cells));
  items
    .filter(item => (excludedItemId === undefined || item.id !== excludedItemId) && item.roomId === roomId && item.containerId === parentId)
    .forEach(item => { if (item.cell !== undefined) occupied.add(item.cell); });
  return occupied;
}

export function occupiedCellsForContainer(id: string, containers: Container[], items: Item[]) {
  const target = containers.find(container => container.id === id);
  return target ? occupiedCells(target.roomId, target.parentId, containers, items, target.id) : new Set<number>();
}

export function validateCells(id: string, cells: number[], containers: Container[], items: Item[]): string | null {
  const target = containers.find(c => c.id === id);
  if (!target) return '模块不存在';
  if (!cells.length) return '请至少选择一个格子';
  if (cells.some(c => !Number.isInteger(c) || c < 0 || c > 63)) return '格子编号无效';
  const blocked = occupiedCellsForContainer(id, containers, items);
  return cells.some(c => blocked.has(c)) ? '格子已被其他模块或物品占用' : null;
}
