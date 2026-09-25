import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Container, Filter, Home, Item, Location, Room, directChildren, directItems, filterLabels, remainingDays, statistics } from './domain';
import { Button, Empty, Icon, IconButton, colors, s } from './ui';
import { cellAt } from './grid-edit';

export function ItemRows({ items, path, categoryName, now, onItem }: { items: Item[]; path: (item: Item) => string; categoryName: (id: string) => string; now: Date; onItem: (item: Item) => void }) {
  if (!items.length) return <Empty text="暂无物品" />;
  return <View>{items.map(item => {
    const days = remainingDays(item.expiry, now);
    const status = days === null ? '无保质期' : days < 0 ? `已过期 ${-days} 天` : days === 0 ? '今天到期' : `${days} 天后到期`;
    return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`查看物品 ${item.name}`} onPress={() => onItem(item)} style={s.itemRow}><Icon name="package" /><View style={{ flex: 1, gap: 4 }}><Text style={s.label}>{item.name}</Text><Text style={s.muted}>{path(item)}</Text><Text style={s.muted}>{categoryName(item.categoryId)}</Text></View><Text style={{ color: days !== null && days < 0 ? colors.danger : colors.muted, fontSize: 12, maxWidth: 90 }}>{status}</Text></Pressable>;
  })}</View>;
}
export function HomePage({ home, items, query, setQuery, searchResults, onHomes, onFilter, onAdd, renderItems, now }: { home: Home; items: Item[]; query: string; setQuery: (q: string) => void; searchResults: Item[]; onHomes: () => void; onFilter: (filter: Filter) => void; onAdd: () => void; renderItems: (items: Item[]) => React.ReactNode; now: Date }) {
  const counts = statistics(items, now);
  const upcoming = items.filter(i => { const days = remainingDays(i.expiry, now); return days !== null && days <= 7; }).sort((a, b) => a.expiry!.localeCompare(b.expiry!));
  return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Pressable accessibilityRole="button" accessibilityLabel="选择家庭" onPress={onHomes} style={s.headingRow}><Text style={s.title}>{home.name}</Text><Icon name="chevron-down" /></Pressable>
    <TextInput accessibilityLabel="搜索所有家的物品" placeholder="搜索所有家的物品、分类或位置" value={query} onChangeText={setQuery} style={s.input} />
    {query.trim() ? <><Text style={s.h2}>搜索结果 · {searchResults.length}</Text>{renderItems(searchResults)}</> : <>
      <View style={s.wrap}>{(Object.keys(filterLabels) as Filter[]).map(filter => <Pressable accessibilityRole="button" accessibilityLabel={`${filterLabels[filter]} ${counts[filter]}`} key={filter} onPress={() => onFilter(filter)} style={{ width: '48%', minHeight: 96, padding: 12, borderBottomWidth: 2, borderColor: filter === 'expired' ? '#D98277' : colors.line, gap: 8 }}><Text style={s.muted}>{filterLabels[filter]}</Text><Text style={{ fontSize: 28, fontWeight: '700', color: filter === 'expired' ? colors.danger : colors.ink }}>{counts[filter]}</Text></Pressable>)}</View>
      <Text style={s.h2}>到期概览</Text>{upcoming.length ? renderItems(upcoming) : <Empty text="暂无临期或已过期物品" />}
    </>}
    <Button title="记录物品" icon="plus" onPress={onAdd} />
  </ScrollView>;
}
export function Grid({ children, items, preview = false, onContainer, onItem, editingId, draftCells, onToggleCell }: { children: Container[]; items: Item[]; preview?: boolean; onContainer?: (id: string) => void; onItem?: (item: Item) => void; editingId?: string; draftCells?: number[]; onToggleCell?: (cell: number) => void }) {
  const [width, setWidth] = useState(0);
  const painted = useRef(new Set<number>());
  const size = width / 8;
  const paintAt = (x: number, y: number) => { if (!editingId || painted.current.has(cellAt(x, y, width) ?? -1)) return; const cell = cellAt(x, y, width); if (cell === null) return; painted.current.add(cell); onToggleCell?.(cell); };
  return <View testID={preview ? 'grid-preview' : 'layout-grid'} onLayout={e => setWidth(e.nativeEvent.layout.width)} onStartShouldSetResponderCapture={() => !!editingId} onResponderGrant={e => { painted.current.clear(); paintAt(e.nativeEvent.locationX, e.nativeEvent.locationY); }} onResponderMove={e => paintAt(e.nativeEvent.locationX, e.nativeEvent.locationY)} onResponderRelease={() => painted.current.clear()} style={{ width: '100%', aspectRatio: 1, backgroundColor: '#FFF', overflow: 'hidden' }}>
    {width > 0 && Array.from({ length: 64 }, (_, cell) => {
      const child = children.find(c => c.cells.includes(cell)); const item = items.find(i => i.cell === cell); const editing = !!editingId; const selected = !!draftCells?.includes(cell);
      return <Pressable key={cell} testID={preview ? undefined : `cell-${cell}`} accessibilityRole={child || item || editing ? 'button' : undefined} accessibilityLabel={editing ? `编辑第 ${cell + 1} 格` : child ? `进入模块 ${child.name}` : item ? `查看物品 ${item.name}` : undefined} disabled={preview || (!editing && !child && !item)} onPress={() => editing ? onToggleCell?.(cell) : child ? onContainer?.(child.id) : item && onItem?.(item)} style={{ position: 'absolute', left: (cell % 8) * size, top: Math.floor(cell / 8) * size, width: size, height: size, borderWidth: .5, borderColor: colors.line, backgroundColor: editing && selected ? '#79B89B' : child ? '#B9D7C6' : item ? '#F4D6C7' : '#FAFCFB', padding: preview ? 0 : 2, justifyContent: 'center', overflow: 'hidden' }}>
        {!preview && <Text numberOfLines={2} style={{ fontSize: 10, textAlign: 'center', color: colors.ink }}>{child?.cells[0] === cell ? child.name : item?.name}</Text>}
      </Pressable>;
    })}
  </View>;
}
export function RoomsPage({ home, rooms, items, containers, onOpen, onCreate, onRename, onDelete }: { home: Home; rooms: Room[]; items: Item[]; containers: Container[]; onOpen: (id: string) => void; onCreate: () => void; onRename: (room: Room) => void; onDelete: (room: Room) => void }) {
  return <ScrollView contentContainerStyle={s.page}><View><Text style={s.title}>房间</Text><Text style={s.muted}>{home.name}</Text></View>
    {!rooms.length && <Empty text="这个家还没有房间" />}
    <View style={s.wrap}>{rooms.map(room => <View key={room.id} style={[s.card, { width: '48%' }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`打开房间 ${room.name}`} onPress={() => onOpen(room.id)} style={{ gap: 10 }}><Grid preview children={directChildren(containers, room.id)} items={directItems(items, room.id)} /><Text style={s.h2}>{room.name}</Text><Text style={s.muted}>{items.filter(i => i.roomId === room.id).length} 件物品</Text></Pressable>
      <View style={s.row}><IconButton name="edit-2" label={`重命名房间 ${room.name}`} onPress={() => onRename(room)} /><IconButton name="trash-2" label={`删除房间 ${room.name}`} onPress={() => onDelete(room)} /></View>
    </View>)}</View><Button title="新增房间" icon="plus" onPress={onCreate} />
  </ScrollView>;
}
export function LayoutPage({ room, location, containers, items, path, onBack, onEnter, onItem, onAdd, onCreateContainer, onRenameContainer, onDeleteContainer, onUpdateContainerCells, onDelete, renderItems }: { room: Room; location: Location; containers: Container[]; items: Item[]; path: string; onBack: () => void; onEnter: (id: string) => void; onItem: (item: Item) => void; onAdd: () => void; onCreateContainer: () => void; onRenameContainer: (container: Container) => void; onDeleteContainer: (container: Container) => void; onUpdateContainerCells: (id: string, cells: number[]) => string | null; onDelete: () => void; renderItems: (items: Item[]) => React.ReactNode }) {
  const [editingId, setEditingId] = useState<string>();
  const [draftCells, setDraftCells] = useState<number[]>([]);
  const [editError, setEditError] = useState('');
  const current = containers.find(c => c.id === location.containerId);
  const children = directChildren(containers, room.id, location.containerId);
  const contents = directItems(items, room.id, location.containerId);
  return <ScrollView scrollEnabled={!editingId} contentContainerStyle={s.page}><View style={s.headingRow}><IconButton name="arrow-left" label="返回上一级" onPress={onBack} /><Text style={[s.h2, { flex: 1 }]}>{editingId ? `编辑布局 · ${children.find(c => c.id === editingId)?.name ?? ''}` : current?.name ?? room.name}</Text>{!editingId && (current ? <View style={s.row}><IconButton name="edit-2" label={`重命名模块 ${current.name}`} onPress={() => onRenameContainer(current)} /><IconButton name="trash-2" label={`删除模块 ${current.name}`} onPress={() => onDeleteContainer(current)} /></View> : <IconButton name="trash-2" label="删除房间" onPress={onDelete} />)}</View>
    <Text style={s.muted}>{path}</Text><View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}><Grid children={children} items={contents} onContainer={onEnter} onItem={onItem} editingId={editingId} draftCells={draftCells} onToggleCell={cell => { const blocked = new Set(children.filter(c => c.id !== editingId).flatMap(c => c.cells)); contents.forEach(i => { if (i.cell !== undefined) blocked.add(i.cell); }); if (blocked.has(cell)) return; setDraftCells(cells => cells.includes(cell) ? cells.filter(c => c !== cell) : [...cells, cell]); }} /></View>
    {editingId && <><Text accessibilityRole="alert" style={s.error}>{editError}</Text><View style={s.row}><Button title="保存网格" onPress={() => { const message = onUpdateContainerCells(editingId, draftCells); if (message) setEditError(message); else setEditingId(undefined); }} /><Button title="取消" secondary onPress={() => setEditingId(undefined)} /></View></>}
    {editingId ? null : children.map(child => <View key={child.id} style={s.itemRow}><Pressable accessibilityRole="button" accessibilityLabel={`打开模块 ${child.name}`} onPress={() => onEnter(child.id)} style={[s.row, { flex: 1 }]}><Icon name="archive" /><Text style={[s.label, { flex: 1 }]}>{child.name}</Text><Icon name="chevron-right" /></Pressable><Button title="编辑布局" icon="grid" secondary onPress={() => { setEditError(''); setEditingId(child.id); setDraftCells(child.cells); }} /><IconButton name="edit-2" label={`重命名模块 ${child.name}`} onPress={() => onRenameContainer(child)} /><IconButton name="trash-2" label={`删除模块 ${child.name}`} onPress={() => onDeleteContainer(child)} /></View>)}
    {!editingId && <><Text style={s.h2}>直属物品</Text>{renderItems(contents)}<Button title="在此位置记录物品" icon="plus" onPress={onAdd} />{(!current || current.level < 3) && <Button title="新增模块" icon="archive" secondary onPress={onCreateContainer} />}</>}
  </ScrollView>;
}
