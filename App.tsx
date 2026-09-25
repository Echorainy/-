import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Category, Container, Filter, Home, Item, Location, Room, DEFAULT_MODULE_COLOR, MODULE_COLORS, containerDescendants, createInitialData, directChildren, directItems, filterLabels, homeItems, isValidHexColor, locationPath, matchesFilter, moduleColorTextColor, normalizeModuleColor, removeContainerContents, validateName } from './src/domain';
import { occupiedCells, validateCells } from './src/grid-edit';
import { Button, Chip, Empty, Field, Icon, IconButton, IconName, Sheet, colors, s, useToday } from './src/ui';
import { HomePage, ItemRows, LayoutPage, RoomsPage } from './src/pages';
import { ItemForm } from './src/ItemForm';
import { loadSnapshot, saveSnapshot } from './src/storage';
import { initializeNotifications, notificationsAvailable, cancelItemReminder, requestNotificationPermission, rescheduleAllReminders, scheduleItemReminder } from './src/notifications';


type Tab = 'home' | 'rooms' | 'items' | 'settings';
type Editor = { kind: 'home' | 'room' | 'category' | 'container'; id?: string; roomId?: string; parentId?: string };
type Confirmation = { title: string; message: string; run: () => void };
let sequence = 0;
const newId = () => `local-${Date.now()}-${++sequence}`;

export default function App() {
  const [data, setData] = useState(createInitialData);
  const { homes, rooms, containers, items, categories } = data;
  const [activeHomeId, setActiveHomeId] = useState('home');
  const [tab, setTab] = useState<Tab>('home');
  const [location, setLocation] = useState<Location | undefined>();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [homeMenu, setHomeMenu] = useState(false);
  const [editor, setEditor] = useState<Editor>();
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState(DEFAULT_MODULE_COLOR);
  const [error, setError] = useState('');
  const [itemForm, setItemForm] = useState<{ initialLocation?: Location; item?: Item }>();
  const [selectedItemId, setSelectedItemId] = useState<string>();
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [hydrated, setHydrated] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const now = useToday();
  useEffect(() => {
    let active = true;
    loadSnapshot().then(snapshot => { if (active) { setData(snapshot); setHydrated(true); void rescheduleAllReminders(snapshot.items); } }).catch(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (hydrated) void saveSnapshot(data); }, [data, hydrated]);
  useEffect(() => { void initializeNotifications().then(granted => setNotificationPermission(granted ? 'granted' : 'denied')).catch(() => setNotificationPermission('denied')); }, []);
  const home = homes.find(h => h.id === activeHomeId)!;
  const currentRooms = rooms.filter(r => r.homeId === activeHomeId);
  const currentItems = homeItems(items, rooms, activeHomeId);
  const activeRoom = currentRooms.find(r => r.id === location?.roomId);
  const selectedItem = items.find(i => i.id === selectedItemId);
  const path = (item: Item | Location) => locationPath(item.roomId, item.containerId, homes, rooms, containers);
  const categoryName = (id: string) => categories.find(c => c.id === id)?.name ?? '未分类';
  const searchResults = items.filter(i => `${i.name} ${path(i)} ${categoryName(i.categoryId)}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const renderItems = (rows: Item[]) => <ItemRows items={rows} path={path} categoryName={categoryName} now={now} onItem={item => setSelectedItemId(item.id)} />;

  const back = () => {
    if (!location) return;
    const module = containers.find(c => c.id === location.containerId);
    setLocation(module ? { roomId: location.roomId, containerId: module.parentId } : undefined);
  };
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab !== 'rooms' || !location || homeMenu || editor || itemForm || selectedItemId || confirmation) return false;
      back(); return true;
    });
    return () => subscription.remove();
  }, [tab, location, containers, homeMenu, editor, itemForm, selectedItemId, confirmation]);

  const switchHome = (id: string) => {
    setActiveHomeId(id); setLocation(undefined); setFilter('all'); setQuery('');
    setHomeMenu(false); setItemForm(undefined); setSelectedItemId(undefined);
  };
  const openEditor = (kind: Editor['kind'], entity?: Home | Room | Category | Container, context?: { roomId?: string; parentId?: string }) => {
    setHomeMenu(false); setEditor({ kind, id: entity?.id, roomId: context?.roomId ?? (entity as Container | undefined)?.roomId, parentId: context?.parentId ?? (entity as Container | undefined)?.parentId }); setDraftName(entity?.name ?? ''); setDraftColor(kind === 'container' ? normalizeModuleColor((entity as Container | undefined)?.color) : DEFAULT_MODULE_COLOR); setError('');
  };
  const saveName = () => {
    if (!editor) return;
    const scope = editor.kind === 'home' ? homes : editor.kind === 'room' ? currentRooms : editor.kind === 'category' ? categories : containers.filter(c => c.roomId === editor.roomId && c.parentId === editor.parentId);
    const message = validateName(draftName, scope, editor.id);
    if (message) return setError(message);
    if (editor.kind === 'category' && editor.id === 'uncategorized') return setError('未分类不能修改');
    if (editor.kind === 'container' && !isValidHexColor(draftColor)) return setError('请输入有效的 HEX 颜色，如 #C98F7A');
    const name = draftName.trim(); const id = editor.id ?? newId();
    if (editor.kind === 'home') {
      setData(d => ({ ...d, homes: editor.id ? d.homes.map(h => h.id === id ? { ...h, name } : h) : [...d.homes, { id, name }] }));
      if (!editor.id) switchHome(id);
    } else if (editor.kind === 'room') {
      setData(d => ({ ...d, rooms: editor.id ? d.rooms.map(r => r.id === id ? { ...r, name } : r) : [...d.rooms, { id, name, homeId: activeHomeId, layout: { rows: 8, cols: 8 } }] }));
    } else if (editor.kind === 'category') {
      setData(d => ({ ...d, categories: editor.id ? d.categories.map(c => c.id === id ? { ...c, name } : c) : [...d.categories, { id, name, isSystem: false }] }));
    } else {
      const level = editor.parentId ? 3 : 2;
      const color = normalizeModuleColor(draftColor);
      setData(d => ({ ...d, containers: editor.id ? d.containers.map(c => c.id === id ? { ...c, name, color } : c) : [...d.containers, { id, name, roomId: editor.roomId!, parentId: editor.parentId, level, cells: [], color }] }));
    }
    setEditor(undefined);
  };
  const beginItem = (initialLocation?: Location) => {
    if (!currentRooms.length) { setTab('rooms'); setLocation(undefined); openEditor('room'); return; }
    setItemForm({ initialLocation });
  };
  const saveItem = (draft: Omit<Item, 'id'>, editingId?: string) => {
    if (!currentRooms.some(r => r.id === draft.roomId)) return '请选择当前家的房间';
    if (draft.containerId && !containers.some(c => c.id === draft.containerId && c.roomId === draft.roomId)) return '请选择有效模块';
    const occupied = occupiedCells(draft.roomId, draft.containerId, containers, items, undefined, editingId);
    const cell = draft.cell !== undefined && !occupied.has(draft.cell) ? draft.cell : Array.from({ length: 64 }, (_, i) => i).find(i => !occupied.has(i));
    const saved = { ...draft, id: editingId ?? newId(), cell };
    setData(d => ({ ...d, items: editingId ? d.items.map(i => i.id === editingId ? saved : i) : [...d.items, saved] }));
    void scheduleItemReminder(saved);
    setItemForm(undefined); return null;
  };
  const deleteContainer = (container: Container) => {
    const descendants = containerDescendants(containers, container.id);
    const itemCount = items.filter(i => i.containerId && descendants.some(c => c.id === i.containerId)).length;
    setConfirmation({ title: `删除模块“${container.name}”？`, message: `将删除 ${descendants.length} 个模块和 ${itemCount} 件物品，删除后无法恢复。`, run: () => {
      const result = removeContainerContents(containers, items, container.id);
      setData(d => ({ ...d, containers: result.containers, items: result.items }));
      setLocation(container.parentId ? { roomId: container.roomId, containerId: container.parentId } : { roomId: container.roomId });
    } });
  };
  const updateContainerCells = (id: string, cells: number[]) => { const message = validateCells(id, cells, containers, items); if (message) return message; setData(d => ({ ...d, containers: d.containers.map(c => c.id === id ? { ...c, cells: [...new Set(cells)] } : c) })); return null; };
  const deleteRoom = (room: Room) => {
    const moduleCount = containers.filter(c => c.roomId === room.id).length;
    const itemCount = items.filter(i => i.roomId === room.id).length;
    setConfirmation({ title: `删除房间“${room.name}”？`, message: `将删除 ${moduleCount} 个模块和 ${itemCount} 件物品，删除后无法恢复。`, run: () => {
      setData(d => ({ ...d, rooms: d.rooms.filter(r => r.id !== room.id), containers: d.containers.filter(c => c.roomId !== room.id), items: d.items.filter(i => i.roomId !== room.id) }));
      setLocation(undefined); setSelectedItemId(undefined); setItemForm(undefined);
    } });
  };
  const deleteCategory = (category: Category) => {
    if (category.id === 'uncategorized') return;
    setConfirmation({ title: `删除分类“${category.name}”？`, message: '物品会保留，分类改为“未分类”。此修改适用于所有家。', run: () => {
      setData(d => ({ ...d, categories: d.categories.filter(c => c.id !== category.id), items: d.items.map(i => i.categoryId === category.id ? { ...i, categoryId: 'uncategorized' } : i) }));
    } });
  };
  const deleteItem = (item: Item) => {
    setConfirmation({ title: `删除物品“${item.name}”？`, message: '删除后无法恢复，同时会取消它的到期提醒。', run: () => {
      setData(d => ({ ...d, items: d.items.filter(i => i.id !== item.id) }));
      void cancelItemReminder(item.id); setSelectedItemId(undefined);
    } });
  };
  const chooseTab = (next: Tab) => { setTab(next); if (next === 'rooms') setLocation(undefined); if (next === 'items') setFilter('all'); };
  const nav: [Tab, IconName, string][] = [['home', 'home', '首页'], ['rooms', 'grid', '房间'], ['items', 'package', '物品'], ['settings', 'settings', '设置']];

  if (!hydrated) return <SafeAreaView style={s.screen}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}><ActivityIndicator color={colors.accent} /><Text style={s.muted}>正在读取本地数据…</Text></View></SafeAreaView>;
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaView style={s.screen}><StatusBar barStyle="dark-content" /><View style={s.content}>
    {tab === 'home' && <HomePage home={home} items={currentItems} query={query} setQuery={setQuery} searchResults={searchResults} onHomes={() => setHomeMenu(true)} onFilter={value => { setFilter(value); setTab('items'); }} onAdd={() => beginItem()} renderItems={renderItems} now={now} />}
    {tab === 'rooms' && (activeRoom && location
      ? <LayoutPage room={activeRoom} location={location} containers={containers} items={items} path={path(location)} onBack={back} onEnter={id => setLocation({ roomId: activeRoom.id, containerId: id })} onItem={i => setSelectedItemId(i.id)} onAdd={() => beginItem(location)} onCreateContainer={() => openEditor('container', undefined, { roomId: activeRoom.id, parentId: location.containerId })} onRenameContainer={c => openEditor('container', c)} onDeleteContainer={deleteContainer} onUpdateContainerCells={updateContainerCells} onDelete={() => deleteRoom(activeRoom)} renderItems={renderItems} />
      : <RoomsPage home={home} rooms={currentRooms} containers={containers} items={currentItems} onOpen={id => setLocation({ roomId: id })} onCreate={() => openEditor('room')} onRename={room => openEditor('room', room)} onDelete={deleteRoom} />)}
    {tab === 'items' && <ScrollView contentContainerStyle={s.page}><View style={s.pageIntro}><Text style={s.title}>物品</Text><Text style={s.muted}>{home.name}</Text></View><View style={s.sectionCard}><View style={s.sectionHeader}><Text style={s.h2}>家里的物品</Text><Text style={s.muted}>{currentItems.length} 件</Text></View><Text style={s.sectionCaption}>按到期状态查看和整理家里的每件物品。</Text><View style={s.filterPanel}><Text style={s.label}>筛选范围</Text><View style={s.wrap}>{(Object.keys(filterLabels) as Filter[]).map(key => <Chip key={key} label={filterLabels[key]} selected={filter === key} onPress={() => setFilter(key)} />)}</View></View><View style={s.itemListCard}>{renderItems(currentItems.filter(i => matchesFilter(i, filter, now)))}</View></View><Button title="记录物品" icon="plus" onPress={() => beginItem()} /></ScrollView>}
    {tab === 'settings' && <ScrollView contentContainerStyle={s.page}><View style={s.pageIntro}><Text style={s.title}>设置</Text><Text style={s.muted}>把家庭、分类和提醒整理成适合你的样子。</Text></View><View style={s.sectionCard}><View style={s.sectionHeader}><Text style={s.h2}>家庭管理</Text><Text style={s.statusBadge}>{homes.length} 个家</Text></View>{homes.map((h, index) => <View key={h.id} style={[s.settingsRow, index === homes.length - 1 && s.settingsRowLast]}><Pressable accessibilityRole="button" accessibilityLabel={`切换到 ${h.name}`} onPress={() => switchHome(h.id)} style={[s.row, s.settingsCopy]}><Icon name={activeHomeId === h.id ? 'check-circle' : 'home'} color={activeHomeId === h.id ? colors.accent : colors.muted} /><Text style={[s.label, { flexShrink: 1 }]}>{h.name}</Text></Pressable><View style={s.settingsActions}><IconButton name="edit-2" label={`重命名家庭 ${h.name}`} onPress={() => openEditor('home', h)} /></View></View>)}<Button title="新建家" icon="plus" secondary onPress={() => openEditor('home')} /></View><View style={s.sectionCard}><View style={s.sectionHeader}><Text style={s.h2}>分类标签</Text><Text style={s.statusBadge}>{categories.length} 个分类</Text></View>{categories.map((c, index) => <View key={c.id} style={[s.settingsRow, index === categories.length - 1 && s.settingsRowLast]}><View style={s.settingsCopy}><Text style={s.label}>{c.name}</Text><Text style={s.sectionCaption}>{c.isSystem ? '系统分类' : '可编辑分类'}</Text></View>{!c.isSystem && <View style={s.settingsActions}><IconButton name="edit-2" label={`修改分类 ${c.name}`} onPress={() => openEditor('category', c)} /><IconButton name="trash-2" label={`删除分类 ${c.name}`} onPress={() => deleteCategory(c)} /></View>}</View>)}<Button title="新增分类" icon="plus" secondary onPress={() => openEditor('category')} /></View><View style={s.sectionCard}><View style={s.sectionHeader}><Text style={s.h2}>到期提醒</Text><Icon name="bell" color={colors.accent} /></View><Text style={s.sectionCaption}>{!notificationsAvailable ? '当前预览环境不启用系统通知，请安装独立开发版测试到期提醒。' : notificationPermission === 'granted' ? '已允许发送本地通知' : '尚未允许发送本地通知'}</Text><Button title="启用到期提醒" icon="bell" secondary disabled={!notificationsAvailable || notificationPermission === 'granted'} onPress={() => { void requestNotificationPermission().then(granted => { setNotificationPermission(granted ? 'granted' : 'denied'); if (granted) void rescheduleAllReminders(items); }); }} /></View></ScrollView>}
  </View><View style={s.nav}>{nav.map(([key, icon, label]) => <Pressable key={key} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: tab === key }} style={s.navItem} onPress={() => chooseTab(key)}><Icon name={icon} color={tab === key ? colors.accent : colors.muted} /><Text style={[s.navLabel, tab === key && { color: colors.accent }]}>{label}</Text></Pressable>)}</View>
    {homeMenu && <Sheet title="选择家庭" onClose={() => setHomeMenu(false)}>{homes.map(h => <View key={h.id} style={s.headingRow}><Pressable accessibilityRole="button" accessibilityLabel={`切换到 ${h.name}`} onPress={() => switchHome(h.id)} style={[s.row, { flex: 1, minHeight: 48 }]}><Icon name={h.id === activeHomeId ? 'check-circle' : 'home'} /><Text style={[s.label, { flexShrink: 1 }]}>{h.name}</Text></Pressable><IconButton name="edit-2" label={`重命名家庭 ${h.name}`} onPress={() => openEditor('home', h)} /></View>)}<Button title="新建家" icon="plus" onPress={() => openEditor('home')} /></Sheet>}
    {editor && <Sheet title={`${editor.id ? '编辑' : '新增'}${editor.kind === 'home' ? '家庭' : editor.kind === 'room' ? '房间' : editor.kind === 'category' ? '分类' : '模块'}`} onClose={() => setEditor(undefined)}><Field label="名称" value={draftName} onChangeText={setDraftName} />{editor.kind === 'container' && <View style={{ gap: 8, marginVertical: 10 }}><Text style={s.label}>模块颜色</Text><View style={s.wrap}>{MODULE_COLORS.map((color, index) => { const selected = draftColor.trim().toUpperCase() === color; return <Pressable key={color} accessibilityRole="radio" accessibilityLabel={`选择模块颜色 ${index + 1}`} accessibilityState={{ selected }} onPress={() => setDraftColor(color)} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: color, borderWidth: selected ? 3 : 1, borderColor: selected ? colors.ink : colors.line, alignItems: 'center', justifyContent: 'center' }}>{selected && <Text style={{ color: moduleColorTextColor(color), fontWeight: '700' }}>✓</Text>}</Pressable>; })}</View><Field label="HEX 色值" value={draftColor} onChangeText={setDraftColor} placeholder="#C98F7A" /></View>}{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Button title={editor.kind === 'container' ? '保存模块' : '保存名称'} onPress={saveName} /></Sheet>}
    {itemForm && <ItemForm rooms={currentRooms} containers={containers} categories={categories} initialLocation={itemForm.initialLocation} item={itemForm.item} onClose={() => setItemForm(undefined)} onSave={saveItem} />}
    {selectedItem && <Sheet title={selectedItem.name} onClose={() => setSelectedItemId(undefined)}><View style={{ gap: 12 }}><Text style={s.muted}>{path(selectedItem)}</Text><Text style={s.label}>分类：{categoryName(selectedItem.categoryId)}</Text><Text style={s.muted}>{selectedItem.expiry ? `过期日期：${selectedItem.expiry}` : '未设置保质期'}</Text><Button title="编辑物品" icon="edit-2" onPress={() => { setItemForm({ item: selectedItem }); setSelectedItemId(undefined); }} /><Button title="删除物品" icon="trash-2" secondary onPress={() => deleteItem(selectedItem)} /></View></Sheet>}
    {confirmation && <Sheet title={confirmation.title} onClose={() => setConfirmation(undefined)}><Text style={s.muted}>{confirmation.message}</Text><Button title="确认删除" onPress={() => { confirmation.run(); setConfirmation(undefined); }} /><Button title="取消" secondary onPress={() => setConfirmation(undefined)} /></Sheet>}
  </SafeAreaView></GestureHandlerRootView>;
}
