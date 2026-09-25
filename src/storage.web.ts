import { Snapshot, decodeSnapshot, emptySnapshot, encodeSnapshot } from './persistence';

const STORAGE_KEY = 'home-whereabouts.snapshot';

export async function loadSnapshot(): Promise<Snapshot> {
  try {
    return decodeSnapshot(globalThis.localStorage?.getItem(STORAGE_KEY) ?? '');
  } catch {
    return emptySnapshot();
  }
}

export async function saveSnapshot(snapshot: Snapshot) {
  globalThis.localStorage?.setItem(STORAGE_KEY, encodeSnapshot(snapshot));
}
