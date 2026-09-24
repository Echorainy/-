import { createInitialData } from './domain.ts';
import type { Category, Container, Home, Item, Room } from './domain.ts';

export type Snapshot = { homes: Home[]; rooms: Room[]; containers: Container[]; items: Item[]; categories: Category[] };
export const emptySnapshot = (): Snapshot => createInitialData();

export function encodeSnapshot(snapshot: Snapshot) { return JSON.stringify(snapshot); }
export function decodeSnapshot(value: string): Snapshot { const parsed = JSON.parse(value); if (!isSnapshot(parsed)) throw new Error('Invalid snapshot'); return parsed; }
function isSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Snapshot>;
  return Array.isArray(candidate.homes) && Array.isArray(candidate.rooms) && Array.isArray(candidate.containers) && Array.isArray(candidate.items) && Array.isArray(candidate.categories) && candidate.rooms.every(room => room && typeof room.id === 'string' && typeof room.homeId === 'string' && room.layout?.rows === 8 && room.layout?.cols === 8);
}
export function migrateSnapshot(value: string | null | undefined): Snapshot {
  if (!value) return emptySnapshot();
  try { return decodeSnapshot(value); } catch { return emptySnapshot(); }
}
