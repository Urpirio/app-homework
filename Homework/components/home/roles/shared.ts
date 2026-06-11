import { StyleSheet } from 'react-native';

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export function getDaysLabel(dueDate: string): string {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return `${diff}d`;
}

export function getDueBadgeColor(dueDate: string, theme: any): string {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff <= 1) return '#FF3B30';
  if (diff <= 3) return '#FF9500';
  return theme.colors.primaryLight;
}

export const sharedStyles = StyleSheet.create({
  bannerCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerContent: { flex: 1 },
  bannerGreeting: { color: '#FFF', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  bannerBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  badgeNumber: { color: '#FFF', fontSize: 20, fontWeight: '900' },

  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  quickItem: { width: '31%' },
  quickCard: { alignItems: 'center', paddingVertical: 15, borderRadius: 20, gap: 8 },
  quickLabel: { fontSize: 10, fontWeight: '700' },

  section: { marginTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },

  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 15 },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  listSub: { fontSize: 11, fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, minWidth: 40, alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
});
