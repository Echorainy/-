import test from 'node:test';
import assert from 'node:assert/strict';
import { reminderDate } from '../src/notification-date.ts';

test('calculates reminder date from expiry and per-item lead days', () => {
  assert.equal(reminderDate('2026-10-10', 7), '2026-10-03');
  assert.equal(reminderDate('2024-03-01', 1), '2024-02-29');
  assert.equal(reminderDate(undefined, 7), null);
  assert.equal(reminderDate('bad-date', 7), null);
});
