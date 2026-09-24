import test from 'node:test';
import assert from 'node:assert/strict';
import { reminderDate } from '../src/notification-date.ts';

test('calculates reminder date from expiry and per-item lead days', () => {
  assert.equal(reminderDate('2026-10-10', 7), '2026-10-03');
  assert.equal(reminderDate('2024-03-01', 1), '2024-02-29');
  assert.equal(reminderDate(undefined, 7), null);
  assert.equal(reminderDate('bad-date', 7), null);
});

// Execute the notification boundary with native dependencies replaced: loading the
// native library in Expo Go reproduces the device's startup failure.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function loadNotifications(expoGo, platform = 'android') {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../src/notifications.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, { exports, require(name) {
    if (name === 'expo') return { isRunningInExpoGo: () => expoGo };
    if (name === 'react-native') return { Platform: { OS: platform } };
    if (name === './notification-date') return { reminderDate };
    if (name === 'expo-notifications') throw new Error('Native notifications loaded in unsupported runtime');
    throw new Error(`Unexpected import: ${name}`);
  } });
  return exports;
}

for (const [label, expoGo, platform] of [['Expo Go', true, 'android'], ['web', false, 'web']]) {
  test(`${label} can load and use reminder helpers without loading native notifications`, async () => {
    const api = loadNotifications(expoGo, platform);
    assert.equal(await api.requestNotificationPermission(), false);
    assert.equal(await api.scheduleItemReminder({ id: 'test', expiry: '2099-01-01', reminderDays: 7 }), null);
    await api.cancelItemReminder('test');
    await api.rescheduleAllReminders([{ id: 'test' }]);
    assert.equal(await api.initializeNotifications(), false);
  });
}
