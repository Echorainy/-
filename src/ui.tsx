import React, { useEffect, useState } from 'react';
import { AppState, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { localDate } from './domain';
export type IconName = React.ComponentProps<typeof Feather>['name'];
export const colors = { ink: '#242C2A', muted: '#64716C', line: '#DEE5E1', accent: '#28775C', soft: '#E9F4EE', danger: '#B44342' };
export function Icon({ name, color = colors.ink }: { name: IconName; color?: string }) { return <Feather name={name} size={20} color={color} />; }
export function IconButton({ name, label, onPress }: { name: IconName; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={s.iconButton}><Icon name={name} /></Pressable>;
}
export function Button({ title, onPress, secondary = false, icon, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; icon?: IconName; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={onPress} style={[s.button, secondary && s.secondary, disabled && { opacity: .4 }]}>{icon && <Icon name={icon} color={secondary ? colors.accent : '#FFF'} />}<Text style={[s.buttonText, secondary && { color: colors.accent }]}>{title}</Text></Pressable>;
}
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={label} onPress={onPress} style={[s.chip, selected && s.chipSelected]}><Text style={{ color: selected ? colors.accent : colors.ink }}>{label}</Text></Pressable>;
}
export function Field({ label, value, onChangeText, placeholder, numeric = false }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; numeric?: boolean }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} style={s.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#81918A" keyboardType={numeric ? 'number-pad' : 'default'} /></View>;
}
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}><View style={s.backdrop}><View style={s.sheet} accessibilityViewIsModal><View style={s.headingRow}><Text style={s.h2}>{title}</Text><IconButton name="x" label="关闭弹窗" onPress={onClose} /></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>{children}</ScrollView></View></View></Modal>;
}
export function Empty({ text }: { text: string }) { return <View style={s.empty}><Icon name="inbox" color={colors.muted} /><Text style={s.muted}>{text}</Text></View>; }
export function useToday() {
  const [today, setToday] = useState(() => localDate());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer); setToday(localDate());
      const now = new Date(); const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(refresh, Math.max(1, next.getTime() - now.getTime() + 100));
    };
    refresh(); const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { clearTimeout(timer); listener.remove(); };
  }, []);
  return new Date(`${today}T00:00:00`);
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F8F7' }, content: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  page: { padding: 20, gap: 18, paddingBottom: 32 }, title: { fontSize: 28, fontWeight: '700', color: colors.ink, flexShrink: 1, letterSpacing: 0 }, h2: { fontSize: 18, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink }, muted: { color: colors.muted, fontSize: 13, lineHeight: 20 }, headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { gap: 8, marginVertical: 10 }, input: { minHeight: 46, backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.ink },
  button: { minHeight: 46, padding: 12, borderRadius: 8, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 4 }, buttonText: { color: '#FFF', fontWeight: '600', fontSize: 15, flexShrink: 1 }, secondary: { backgroundColor: colors.soft },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, chip: { minHeight: 40, justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFF' }, chipSelected: { borderColor: colors.accent, backgroundColor: colors.soft },
  card: { borderRadius: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.line, padding: 14, gap: 8 }, itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderColor: colors.line },
  empty: { alignItems: 'center', padding: 28, gap: 12 }, backdrop: { flex: 1, backgroundColor: 'rgba(20,32,27,.42)', alignItems: 'center', justifyContent: 'center', padding: 16 }, sheet: { width: '100%', maxWidth: 560, maxHeight: '90%', backgroundColor: '#F6F8F7', borderRadius: 8, padding: 16 }, error: { color: colors.danger, marginVertical: 8 },
  nav: { flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderColor: colors.line }, navItem: { flex: 1, minHeight: 66, alignItems: 'center', justifyContent: 'center', gap: 5 }, navLabel: { fontSize: 12, color: colors.muted },
});
