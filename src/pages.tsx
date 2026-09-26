import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Container, Filter, Home, Item, Location, Room, directChildren, directItems, filterLabels, moduleColorTextColor, normalizeModuleColor, remainingDays, statistics } from './domain';
import { Button, Empty, Icon, IconButton, Mascot, colors, s } from './ui';
import { cellAt, cellFromGesture, occupiedCellsForContainer } from './grid-edit';

export function GridEditor({ initialCells, blockedCells, color, onCancel, onSave }: { initialCells: number[]; blockedCells: number[]; color?: string; onCancel: () => void; onSave: (cells: number[]) => string | null }) {
  const [width, setWidth] = useState(0);
  const [cells, setCells] = useState(() => [...new Set(initialCells)]);
  const [error, setError] = useState('');
  const cellsRef = useRef(cells);
  const touched = useRef(new Set<number>());
  const mode = useRef<'add' | 'remove'>('add');
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const blocked = new Set(blockedCells);
  const toggleCell = (cell: number) => {
    if (dragging.current || blocked.has(cell)) return;
    const next = cellsRef.current.includes(cell) ? cellsRef.current.filter(value => value !== cell) : [...cellsRef.current, cell];
    cellsRef.current = next;
    setCells(next);
  };
  const paint = (x: number, y: number) => {
    const cell = cellFromGesture(x, y, width, width);
    if (cell === null || blocked.has(cell) || touched.current.has(cell)) return;
    touched.current.add(cell);
    const next = mode.current === 'add' ? [...new Set([...cellsRef.current, cell])] : cellsRef.current.filter(value => value !== cell);
    cellsRef.current = next;
    setCells(next);
  };
  const handleGestureEvent = (event: any) => paint(event.nativeEvent.x, event.nativeEvent.y);
  const handleStateChange = (event: any) => {
    const { state, x, y } = event.nativeEvent;
    if (state === State.BEGAN) {
      touched.current.clear();
      const start = cellFromGesture(x, y, width, width);
      mode.current = start !== null && !cellsRef.current.includes(start) ? 'add' : 'remove';
      startPoint.current = { x, y };
      dragging.current = false;
    } else if (state === State.ACTIVE) {
      dragging.current = true;
      if (startPoint.current) paint(startPoint.current.x, startPoint.current.y);
      paint(x, y);
    } else if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      touched.current.clear();
      startPoint.current = null;
      if (state === State.FAILED) dragging.current = false;
    }
  };
  return <View style={{ gap: 12 }}><PanGestureHandler minDist={4} onGestureEvent={handleGestureEvent} onHandlerStateChange={handleStateChange}><View testID="grid-editor" onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.gridEmpty, overflow: 'hidden' }}>
    {width > 0 && Array.from({ length: 64 }, (_, cell) => { const selected = cells.includes(cell); const unavailable = blocked.has(cell); const selectedColor = normalizeModuleColor(color); return <Pressable key={cell} accessibilityRole="button" accessibilityLabel={`编辑第 ${cell + 1} 格`} disabled={unavailable} onPress={() => toggleCell(cell)} style={{ position: 'absolute', left: (cell % 8) * width / 8, top: Math.floor(cell / 8) * width / 8, width: width / 8, height: width / 8, borderWidth: selected ? 1.5 : .5, borderColor: selected ? colors.ink : colors.line, backgroundColor: unavailable ? colors.gridBlocked : selected ? selectedColor : colors.gridEmpty, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 9, color: unavailable ? colors.muted : selected ? moduleColorTextColor(selectedColor) : colors.muted }}>{selected ? '✓' : ''}</Text></Pressable>; })}
  </View></PanGestureHandler><Text style={s.muted}>已选择 {cells.length} 格，可点击或拖动选择</Text>{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<View style={s.row}><Button title="保存布局" onPress={() => { const message = onSave(cells); if (message) setError(message); }} /><Button title="取消" secondary onPress={onCancel} /></View></View>;
}

export function ItemRows({ items, path, categoryName, now, onItem }: { items: Item[]; path: (item: Item) => string; categoryName: (id: string) => string; now: Date; onItem: (item: Item) => void }) {
  if (!items.length) return <Empty text="暂无物品" />;
  return <View>{items.map(item => {
    const days = remainingDays(item.expiry, now);
    const status = days === null ? '无保质期' : days < 0 ? `已过期 ${-days} 天` : days === 0 ? '今天到期' : `${days} 天后到期`;
    const statusStyle = days !== null && days < 0 ? s.statusExpired : days !== null && days <= 7 ? s.statusSoon : s.statusNormal;
    return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`查看物品 ${item.name}`} onPress={() => onItem(item)} style={s.itemRow}><Icon name="package" color={days !== null && days < 0 ? colors.danger : colors.accent} /><View style={{ flex: 1, gap: 4, minWidth: 0 }}><Text style={s.label} numberOfLines={1}>{item.name}</Text><Text style={s.muted} numberOfLines={1}>{path(item)}</Text><Text style={s.muted} numberOfLines={1}>{categoryName(item.categoryId)}</Text></View><Text style={statusStyle}>{status}</Text></Pressable>;
  })}</View>;
}
export function HomePage({ home, items, query, setQuery, searchResults, onHomes, onFilter, onAdd, renderItems, now }: { home: Home; items: Item[]; query: string; setQuery: (q: string) => void; searchResults: Item[]; onHomes: () => void; onFilter: (filter: Filter) => void; onAdd: () => void; renderItems: (items: Item[]) => React.ReactNode; now: Date }) {
  const counts = statistics(items, now);
  const upcoming = items.filter(i => { const days = remainingDays(i.expiry, now); return days !== null && days <= 7; }).sort((a, b) => a.expiry!.localeCompare(b.expiry!));
  return <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <View style={[s.welcome, s.headingRow]}><View style={s.welcomeCopy}><Pressable accessibilityRole="button" accessibilityLabel="选择家庭" onPress={onHomes} style={s.row}><Text style={s.welcomeHome}>{home.name}</Text><Icon name="chevron-down" color={colors.surface} /></Pressable><Text style={s.welcomeGreeting}>今天也要把家照顾好</Text><Text style={s.welcomeNote}>喵今天好好收纳了吗</Text></View><Mascot source={require('../assets/cat-mascot.png')} size={104} /></View>
    <View style={s.searchWrap}><Icon name="search" color={colors.muted} /><TextInput accessibilityLabel="搜索所有家的物品" placeholder="搜索物品、分类或位置" value={query} onChangeText={setQuery} style={[s.input, s.searchInput]} /></View>
    {query.trim() ? <><Text style={s.h2}>搜索结果 · {searchResults.length}</Text>{renderItems(searchResults)}</> : <>
      <Text style={s.h2}>到期提醒</Text><View style={s.statsGrid}>{(Object.keys(filterLabels) as Filter[]).map(filter => { const tone = filter === 'all' ? s.statHoney : filter === 'month' ? s.statPeach : filter === 'week' ? s.statGreen : filter === 'expired' ? s.statTerracotta : s.statSurface; return <Pressable accessibilityRole="button" accessibilityLabel={`${filterLabels[filter]} ${counts[filter]}`} key={filter} onPress={() => onFilter(filter)} style={[s.statCard, tone]}><Text style={s.statLabel}>{filterLabels[filter]}</Text><Text style={s.statValue}>{counts[filter]}</Text></Pressable>; })}</View>
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
  return <View testID={preview ? 'grid-preview' : 'layout-grid'} onLayout={e => setWidth(e.nativeEvent.layout.width)} onStartShouldSetResponderCapture={() => !!editingId} onResponderGrant={e => { painted.current.clear(); paintAt(e.nativeEvent.locationX, e.nativeEvent.locationY); }} onResponderMove={e => paintAt(e.nativeEvent.locationX, e.nativeEvent.locationY)} onResponderRelease={() => painted.current.clear()} style={{ width: '100%', aspectRatio: 1, backgroundColor: colors.gridEmpty, overflow: 'hidden' }}>
    {width > 0 && Array.from({ length: 64 }, (_, cell) => {
      const child = children.find(c => c.cells.includes(cell)); const item = items.find(i => i.cell === cell); const editing = !!editingId; const selected = !!draftCells?.includes(cell);
      return <Pressable key={cell} testID={preview ? undefined : `cell-${cell}`} accessibilityRole={child || item || editing ? 'button' : undefined} accessibilityLabel={editing ? `编辑第 ${cell + 1} 格` : child ? `进入模块 ${child.name}` : item ? `查看物品 ${item.name}` : undefined} disabled={preview || (!editing && !child && !item)} onPress={() => editing ? onToggleCell?.(cell) : child ? onContainer?.(child.id) : item && onItem?.(item)} style={{ position: 'absolute', left: (cell % 8) * size, top: Math.floor(cell / 8) * size, width: size, height: size, borderWidth: .5, borderColor: colors.line, backgroundColor: editing && selected ? normalizeModuleColor(child?.color) : child ? normalizeModuleColor(child.color) : item ? colors.peachSoft : colors.gridEmpty, padding: preview ? 0 : 2, justifyContent: 'center', overflow: 'hidden' }}>
        {!preview && <Text numberOfLines={2} style={{ fontSize: 10, textAlign: 'center', color: colors.ink }}>{child?.cells[0] === cell ? child.name : item?.name}</Text>}
      </Pressable>;
    })}
  </View>;
}
export function RoomsPage({ home, rooms, items, containers, onOpen, onCreate, onRename, onDelete }: { home: Home; rooms: Room[]; items: Item[]; containers: Container[]; onOpen: (id: string) => void; onCreate: () => void; onRename: (room: Room) => void; onDelete: (room: Room) => void }) {
  return <ScrollView contentContainerStyle={s.page}><View style={s.headingRow}><View style={{ gap: 4 }}><Text style={s.title}>房间</Text><Text style={s.muted}>{home.name} · 把每个角落都放回它该在的地方</Text></View><Icon name="home" color={colors.accent} /></View>
    {!rooms.length && <Empty text="这个家还没有房间" />}
    <View style={s.roomGrid}>{rooms.map(room => <View key={room.id} style={s.roomCard}>
      <Pressable accessibilityRole="button" accessibilityLabel={`打开房间 ${room.name}`} onPress={() => onOpen(room.id)} style={{ gap: 12 }}><View style={s.roomPreview}><Grid preview children={directChildren(containers, room.id)} items={directItems(items, room.id)} /></View><View style={s.roomCardHeader}><Text style={s.roomCardTitle}>{room.name}</Text><Text style={s.roomCardMeta}>{items.filter(i => i.roomId === room.id).length} 件物品 · 点击进入</Text></View></Pressable>
      <View style={s.roomCardActions}><IconButton name="edit-2" label={`重命名房间 ${room.name}`} onPress={() => onRename(room)} /><IconButton name="trash-2" label={`删除房间 ${room.name}`} onPress={() => onDelete(room)} /></View>
    </View>)}</View><Button title="新增房间" icon="plus" onPress={onCreate} />
  </ScrollView>;
}
export function LayoutPage({ room, location, containers, items, path, onBack, onEnter, onItem, onAdd, onCreateContainer, onRenameContainer, onDeleteContainer, onUpdateContainerCells, onDelete, renderItems }: { room: Room; location: Location; containers: Container[]; items: Item[]; path: string; onBack: () => void; onEnter: (id: string) => void; onItem: (item: Item) => void; onAdd: () => void; onCreateContainer: () => void; onRenameContainer: (container: Container) => void; onDeleteContainer: (container: Container) => void; onUpdateContainerCells: (id: string, cells: number[]) => string | null; onDelete: () => void; renderItems: (items: Item[]) => React.ReactNode }) {
  const [editingId, setEditingId] = useState<string>();
  const [draftCells, setDraftCells] = useState<number[]>([]);
  const current = containers.find(c => c.id === location.containerId);
  const isTerminal = current?.level === 3;
  const children = directChildren(containers, room.id, location.containerId);
  const contents = directItems(items, room.id, location.containerId);
  return <ScrollView scrollEnabled={!editingId} contentContainerStyle={s.page}><View style={s.headingRow}><IconButton name="arrow-left" label="返回上一级" onPress={onBack} /><Text style={[s.h2, { flex: 1 }]}>{editingId ? `编辑布局 · ${children.find(c => c.id === editingId)?.name ?? ''}` : current?.name ?? room.name}</Text>{!editingId && (current ? <View style={s.row}><IconButton name="edit-2" label={`重命名模块 ${current.name}`} onPress={() => onRenameContainer(current)} /><IconButton name="trash-2" label={`删除模块 ${current.name}`} onPress={() => onDeleteContainer(current)} /></View> : <IconButton name="trash-2" label="删除房间" onPress={onDelete} />)}</View>
    <Text style={s.muted}>{path}</Text>{editingId ? <GridEditor initialCells={[...new Set(draftCells)]} blockedCells={[...occupiedCellsForContainer(editingId, containers, items)]} color={containers.find(c => c.id === editingId)?.color} onSave={cells => { const message = onUpdateContainerCells(editingId, cells); if (!message) setEditingId(undefined); return message; }} onCancel={() => setEditingId(undefined)} /> : !isTerminal && <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}><Grid children={children} items={contents} onContainer={onEnter} onItem={onItem} /></View>}
    {editingId ? null : children.map(child => <View key={child.id} style={s.moduleCard}>
      <Pressable accessibilityRole="button" accessibilityLabel={`打开模块 ${child.name}`} onPress={() => onEnter(child.id)} style={s.moduleNameRow}>
        <View accessibilityLabel={`模块颜色 ${normalizeModuleColor(child.color)}`} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: normalizeModuleColor(child.color), borderWidth: 1, borderColor: colors.line }} />
        <Icon name="archive" />
        <Text style={[s.label, s.moduleName]} numberOfLines={1} ellipsizeMode="tail">{child.name}</Text>
        <Icon name="chevron-right" />
      </Pressable>
      <View style={s.moduleActions}>
        <Button title="编辑布局" icon="grid" secondary onPress={() => { setEditingId(child.id); setDraftCells(child.cells); }} />
        <IconButton name="edit-2" label={`重命名模块 ${child.name}`} onPress={() => onRenameContainer(child)} />
        <IconButton name="trash-2" label={`删除模块 ${child.name}`} onPress={() => onDeleteContainer(child)} />
      </View>
    </View>)}
    {!editingId && <><Text style={s.h2}>直属物品</Text>{renderItems(contents)}<Button title="在此位置记录物品" icon="plus" onPress={onAdd} />{(!current || current.level < 3) && <Button title="新增模块" icon="archive" secondary onPress={onCreateContainer} />}</>}
  </ScrollView>;
}
