import React, { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Category, Container, Item, Location, Room, directChildren, localDate, parseDate } from './domain';
import { Button, Chip, Field, Sheet, colors, s } from './ui';
import { mockClothingAI } from './clothing';

export function ItemForm({ rooms, containers, categories, initialLocation, item, onClose, onSave }: { rooms: Room[]; containers: Container[]; categories: Category[]; initialLocation?: Location; item?: Item; onClose: () => void; onSave: (item: Omit<Item, 'id'>, id?: string) => string | null }) {
  const [name, setName] = useState(item?.name ?? ''); const [categoryId, setCategoryId] = useState(item?.categoryId ?? 'uncategorized');
  const [place, setPlace] = useState<Location | undefined>(item ? { roomId: item.roomId, containerId: item.containerId } : initialLocation);
  const [withExpiry, setWithExpiry] = useState(!!item?.expiry); const [mode, setMode] = useState<'direct' | 'calculated'>('direct');
  const [date, setDate] = useState(item?.expiry ?? ''); const [production, setProduction] = useState(''); const [days, setDays] = useState(''); const [error, setError] = useState(''); const [picker, setPicker] = useState<'expiry' | 'production'>();
  const [clothing, setClothing] = useState(item?.clothing);
  const [recognizing, setRecognizing] = useState(false);
  const pickerValue = (value: string) => parseDate(value) ?? new Date();
  const dateField = (label: string, value: string, kind: 'expiry' | 'production', onChange: (value: string) => void) => <>{Platform.OS === 'web' ? <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" placeholderTextColor="#A89078" style={s.input} /> : <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setPicker(kind)} style={s.input}><Text style={{ color: value ? colors.ink : colors.muted }}>{value || '选择日期'}</Text></Pressable>}{picker === kind && Platform.OS !== 'web' && <DateTimePicker value={pickerValue(value)} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(_, selected) => { if (Platform.OS !== 'ios') setPicker(undefined); if (selected) onChange(localDate(selected)); }} />}</>;
  const save = () => {
    if (!name.trim()) return setError('请填写物品名称');
    if (!place || !rooms.some(r => r.id === place.roomId)) return setError('请选择房间');
    let expiry: string | undefined;
    if (withExpiry) {
      if (mode === 'direct') { if (!parseDate(date)) return setError('请输入有效的过期日期，例如 2026-12-31'); expiry = date; }
      else {
        const start = parseDate(production); const length = Number(days);
        if (!start || !Number.isInteger(length) || length <= 0 || length > 36500) return setError('请填写有效生产日期和 1–36500 的整数天数');
        start.setDate(start.getDate() + length); expiry = localDate(start);
      }
    }
    const message = onSave({ name: name.trim(), categoryId, ...place, expiry, reminderDays: item?.reminderDays ?? 7, cell: item?.cell, ...(categoryId === 'clothes' ? { clothing } : {}) }, item?.id);
    if (message) setError(message);
  };
  const moduleOptions = place ? directChildren(containers, place.roomId) : [];
  const selected = containers.find(c => c.id === place?.containerId);
  const parentId = selected?.level === 3 ? selected.parentId : selected?.id;
  const children = place && parentId ? directChildren(containers, place.roomId, parentId) : [];
  const chooseClothingPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('需要照片权限才能添加衣物图片'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: .8 });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) return;
    setRecognizing(true);
    try {
      const [cutout, recognition] = await Promise.all([mockClothingAI.removeBackground(uri), mockClothingAI.recognize(uri)]);
      setClothing({ imageUri: uri, cutoutUri: cutout.cutoutUri, ...recognition, recognitionStatus: 'confirmed' });
    } catch { setClothing({ imageUri: uri, recognitionStatus: 'failed' }); }
    finally { setRecognizing(false); }
  };
  return <Sheet title={item ? '编辑物品' : '记录物品'} onClose={onClose}>
    <Field label="物品名称" value={name} onChangeText={setName} />
    <Text style={s.label}>房间</Text><View style={s.wrap}>{rooms.map(room => <Chip key={room.id} label={room.name} tone="room" selected={place?.roomId === room.id} onPress={() => setPlace({ roomId: room.id })} />)}</View>
    {place && <><Text style={[s.label, { marginVertical: 10 }]}>存放位置</Text><View style={s.wrap}><Chip label="直接放在房间" tone="neutral" selected={!place.containerId} onPress={() => setPlace({ roomId: place.roomId })} />{moduleOptions.map(c => <Chip key={c.id} label={c.name} tone="module" selected={parentId === c.id} onPress={() => setPlace({ roomId: place.roomId, containerId: c.id })} />)}</View>{!!children.length && <View style={[s.wrap, { marginTop: 8 }]}>{children.map(c => <Chip key={c.id} label={c.name} tone="submodule" selected={place.containerId === c.id} onPress={() => setPlace({ roomId: place.roomId, containerId: c.id })} />)}</View>}</>}
    <Text style={[s.label, { marginVertical: 10 }]}>分类标签</Text><View style={s.wrap}>{categories.map(c => <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => { if (item?.categoryId === 'clothes' && c.id !== 'clothes') return; setCategoryId(c.id); }} />)}</View>
    {categoryId === 'clothes' && <View style={s.sectionCard}><Text style={s.h2}>智能衣柜</Text><Text style={s.sectionCaption}>添加照片后将自动识别类别和风格。</Text>{clothing?.imageUri && <Text style={s.muted} numberOfLines={1}>已添加照片</Text>}<Button title={recognizing ? '识别中…' : '选择衣物照片'} icon="image" secondary disabled={recognizing} onPress={() => { void chooseClothingPhoto(); }} />{clothing?.subcategory && <Text style={s.muted}>识别结果：{clothing.subcategory} · {(clothing.styleTags ?? []).join('、')}</Text>}</View>}
    <Text style={[s.label, { marginVertical: 10 }]}>保质期</Text><View style={s.wrap}><Chip label="不设置保质期" selected={!withExpiry} onPress={() => setWithExpiry(false)} /><Chip label="设置保质期" selected={withExpiry} onPress={() => setWithExpiry(true)} /></View>
    {withExpiry && <><View style={[s.wrap, { marginTop: 12 }]}><Chip label="选择过期日" selected={mode === 'direct'} onPress={() => setMode('direct')} /><Chip label="生产日期 + 天数" selected={mode === 'calculated'} onPress={() => setMode('calculated')} /></View>{mode === 'direct' ? <View style={s.field}><Text style={s.label}>过期日期</Text>{dateField('过期日期', date, 'expiry', setDate)}</View> : <><View style={s.field}><Text style={s.label}>生产日期</Text>{dateField('生产日期', production, 'production', setProduction)}</View><Field label="保质期天数" value={days} onChangeText={setDays} numeric /></>}</>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Button title={item ? '保存修改' : '保存物品'} onPress={save} />
  </Sheet>;
}
