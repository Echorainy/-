import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Category, Container, Item, Location, Room, directChildren, localDate, parseDate } from './domain';
import { Button, Chip, Field, Sheet, s } from './ui';

export function ItemForm({ rooms, containers, categories, initialLocation, onClose, onSave }: { rooms: Room[]; containers: Container[]; categories: Category[]; initialLocation?: Location; onClose: () => void; onSave: (item: Omit<Item, 'id'>) => string | null }) {
  const [name, setName] = useState(''); const [categoryId, setCategoryId] = useState('uncategorized');
  const [place, setPlace] = useState<Location | undefined>(initialLocation);
  const [withExpiry, setWithExpiry] = useState(false); const [mode, setMode] = useState<'direct' | 'calculated'>('direct');
  const [date, setDate] = useState(''); const [production, setProduction] = useState(''); const [days, setDays] = useState(''); const [error, setError] = useState('');
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
    const message = onSave({ name: name.trim(), categoryId, ...place, expiry, reminderDays: 7 });
    if (message) setError(message);
  };
  const moduleOptions = place ? directChildren(containers, place.roomId) : [];
  const selected = containers.find(c => c.id === place?.containerId);
  const parentId = selected?.level === 3 ? selected.parentId : selected?.id;
  const children = place && parentId ? directChildren(containers, place.roomId, parentId) : [];
  return <Sheet title="记录物品" onClose={onClose}>
    <Field label="物品名称" value={name} onChangeText={setName} />
    <Text style={s.label}>房间</Text><View style={s.wrap}>{rooms.map(room => <Chip key={room.id} label={room.name} selected={place?.roomId === room.id} onPress={() => setPlace({ roomId: room.id })} />)}</View>
    {place && <><Text style={[s.label, { marginVertical: 10 }]}>存放位置</Text><View style={s.wrap}><Chip label="直接放在房间" selected={!place.containerId} onPress={() => setPlace({ roomId: place.roomId })} />{moduleOptions.map(c => <Chip key={c.id} label={c.name} selected={parentId === c.id} onPress={() => setPlace({ roomId: place.roomId, containerId: c.id })} />)}</View>{!!children.length && <View style={[s.wrap, { marginTop: 8 }]}>{children.map(c => <Chip key={c.id} label={c.name} selected={place.containerId === c.id} onPress={() => setPlace({ roomId: place.roomId, containerId: c.id })} />)}</View>}</>}
    <Text style={[s.label, { marginVertical: 10 }]}>分类标签</Text><View style={s.wrap}>{categories.map(c => <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />)}</View>
    <Text style={[s.label, { marginVertical: 10 }]}>保质期</Text><View style={s.wrap}><Chip label="不设置保质期" selected={!withExpiry} onPress={() => setWithExpiry(false)} /><Chip label="设置保质期" selected={withExpiry} onPress={() => setWithExpiry(true)} /></View>
    {withExpiry && <><View style={[s.wrap, { marginTop: 12 }]}><Chip label="直接填写过期日" selected={mode === 'direct'} onPress={() => setMode('direct')} /><Chip label="生产日期 + 天数" selected={mode === 'calculated'} onPress={() => setMode('calculated')} /></View>{mode === 'direct' ? <Field label="过期日期" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} /> : <><Field label="生产日期" placeholder="YYYY-MM-DD" value={production} onChangeText={setProduction} /><Field label="保质期天数" value={days} onChangeText={setDays} numeric /></>}</>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Button title="保存物品" onPress={save} />
  </Sheet>;
}
