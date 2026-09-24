import * as SQLite from 'expo-sqlite';
import { Snapshot, decodeSnapshot, emptySnapshot, encodeSnapshot } from './persistence';

const DB_NAME = 'home-whereabouts.db';
let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;
async function database() { databasePromise ??= SQLite.openDatabaseAsync(DB_NAME); return databasePromise; }
export async function loadSnapshot(): Promise<Snapshot> {
  const db = await database();
  await db.execAsync('CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY NOT NULL, snapshot TEXT NOT NULL, updated_at TEXT NOT NULL);');
  const row = await db.getFirstAsync<{ snapshot: string }>('SELECT snapshot FROM app_state WHERE id = 1');
  if (!row?.snapshot) return emptySnapshot();
  try { return decodeSnapshot(row.snapshot); } catch { return emptySnapshot(); }
}
export async function saveSnapshot(snapshot: Snapshot) {
  const db = await database();
  await db.runAsync('INSERT OR REPLACE INTO app_state (id, snapshot, updated_at) VALUES (1, ?, ?)', encodeSnapshot(snapshot), new Date().toISOString());
}
