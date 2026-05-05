import { ClassroomModal } from '@/components/login/ClassroomModal';
import { ClassroomOptionsModal } from '@/components/login/ClassroomOptionsModal';
import { EnrollmentOptionsModal } from '@/components/login/EnrollmentOptionsModal';
import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ThemedView } from '@/components/shared/ThemedView';
import { useInstitutionClassrooms } from '@/hooks/api/useClassrooms';
import { useInstitution as useInstitutionQuery, useInstitutionStats } from '@/hooks/api/useInstitutions';
import { useUsers } from '@/hooks/api/useUsers';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type TabKey = 'overview' | 'classrooms' | 'users' | 'settings';
const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'overview', label: 'General', icon: 'grid-outline' },
  { key: 'classrooms', label: 'Aulas', icon: 'book-outline' },
  { key: 'users', label: 'Usuarios', icon: 'people-outline' },
  { key: 'settings', label: 'Ajustes', icon: 'settings-outline' },
];

function mkCfg(t: any, c: string) {
  return { backgroundColor: t.colors.card, backgroundGradientFrom: t.colors.card, backgroundGradientTo: t.colors.card, decimalCount: 0, color: (o = 1) => c.replace('1)', `${o})`), labelColor: () => t.colors.textSecondary, propsForBackgroundLines: { stroke: t.colors.border + '30' }, propsForLabels: { fontSize: 10 }, style: { borderRadius: 16 } };
}

const cs = StyleSheet.create({ card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, overflow: 'hidden' }, title: { fontSize: 16, fontWeight: '700', marginBottom: 12 } });

export default function InstitutionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [classOptionsVisible, setClassOptionsVisible] = useState(false);
  const [classManualVisible, setClassManualVisible] = useState(false);
  const { data: inst, isLoading: iL, isError: iE, error: eObj, refetch: rI } = useInstitutionQuery(id!);
  const { data: stats, isLoading: sL, refetch: rS } = useInstitutionStats(id!);
  const { data: cls, isLoading: cL } = useInstitutionClassrooms(id!);
  const { data: uD, isLoading: uL, fetchNextPage: fN, hasNextPage: hN } = useUsers({ institutionId: id! });
  const users = useMemo(() => uD?.pages.flatMap((p) => p.data) ?? [], [uD]);
  const loading = iL || sL;
  const refresh = () => { rI(); rS(); };
  const cw = SCREEN_WIDTH - 72;

  if (loading) {
    return (
      <SafeAreaView style={[st.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={st.container}><BackgroundShapes />
          <View style={st.header}><Pressable onPress={() => router.back()} style={st.backBtn}><Ionicons name="arrow-back" size={24} color={theme.colors.text} /></Pressable></View>
          <SkeletonLoader rows={4} variant="detail" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (iE) {
    return (
      <SafeAreaView style={[st.safeArea, { backgroundColor: theme.colors.background }]}>
        <ThemedView style={st.container}><BackgroundShapes />
          <View style={st.header}><Pressable onPress={() => router.back()} style={st.backBtn}><Ionicons name="arrow-back" size={24} color={theme.colors.text} /></Pressable></View>
          <ErrorState error={eObj!} onRetry={refresh} />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[st.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={st.container}>
        <BackgroundShapes />
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={theme.colors.primary} />}>
          {/* Header */}
          <View style={st.headerSection}>
            <Pressable onPress={() => router.back()} style={st.backBtn}><Ionicons name="arrow-back" size={24} color={theme.colors.text} /></Pressable>
            <View style={[st.logoBox, { backgroundColor: theme.colors.primaryLight }]}>
              {inst?.logoUrl ? <Image source={{ uri: inst.logoUrl }} style={st.logoImg} /> : <Ionicons name="business" size={40} color={theme.colors.primary} />}
            </View>
            <Text style={[st.instTitle, { color: theme.colors.text }]}>{inst?.name}</Text>
            <Text style={[st.instAddr, { color: theme.colors.textSecondary }]}>{inst?.address}</Text>
          </View>

          {/* Stats Grid */}
          <View style={st.statsGrid}>
            {([
              { l: 'Alumnos', v: stats?.students ?? inst?._count?.users ?? 0, i: 'people' as const, c: '#007AFF', p: () => router.push(`/admin/institution/${id}/students`) },
              { l: 'Maestros', v: stats?.teachers ?? 0, i: 'school' as const, c: '#5856D6', p: () => router.push(`/admin/institution/${id}/teachers`) },
              { l: 'Aulas', v: stats?.classrooms ?? inst?._count?.projects ?? 0, i: 'book' as const, c: '#FF9500', p: () => router.push(`/admin/institution/${id}/classrooms`) },
              { l: 'Promedio', v: stats?.avgGrade ?? 0, i: 'trending-up' as const, c: '#34C759' },
            ] as const).map((x, idx) => (
              <Animated.View key={x.l} entering={FadeInDown.delay(idx * 100).springify()}>
                <Pressable onPress={'p' in x ? x.p : undefined} style={({ pressed }) => [st.statCard, { backgroundColor: theme.colors.card, opacity: pressed && 'p' in x ? 0.8 : 1, borderWidth: 1, borderColor: theme.colors.border + '50' }]}>
                  <View style={[st.statIcon, { backgroundColor: x.c + '15' }]}><Ionicons name={x.i} size={22} color={x.c} /></View>
                  <View style={st.statContent}><Text style={[st.statVal, { color: theme.colors.text }]}>{x.v}</Text><Text style={[st.statLbl, { color: theme.colors.textSecondary }]}>{x.l}</Text></View>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* Tabs */}
          <View style={st.tabBar}>
            {TABS.map((tab) => (
              <Pressable key={tab.key} onPress={() => { if (tab.key === 'settings') router.push(`/admin/institution/${id}/settings`); else setActiveTab(tab.key); }}
                style={[st.tab, activeTab === tab.key && tab.key !== 'settings' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
                accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab.key }}>
                <Ionicons name={tab.icon} size={18} color={activeTab === tab.key && tab.key !== 'settings' ? theme.colors.primary : theme.colors.textSecondary} />
                <Text style={[st.tabLbl, { color: activeTab === tab.key && tab.key !== 'settings' ? theme.colors.primary : theme.colors.textSecondary }]}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <View style={st.tabContent}>
              <View style={st.section}>
                <Text style={[st.secTitle, { color: theme.colors.text }]}>Acciones Administrativas</Text>
                <View style={st.actionRow}>
                  {([
                    { icon: 'person-add' as const, label: 'Añadir Alumno', fn: () => setOptionsVisible(true) },
                    { icon: 'add-circle' as const, label: 'Nueva Aula', fn: () => setClassOptionsVisible(true) },
                    { icon: 'create' as const, label: 'Editar', fn: () => router.push(`/admin/institution/${id}/edit`) },
                  ]).map((a) => (
                    <Pressable key={a.label} style={st.actionBtn} onPress={a.fn} accessibilityRole="button" accessibilityLabel={a.label}>
                      <View style={[st.actionIcon, { backgroundColor: theme.colors.primaryLight }]}><Ionicons name={a.icon} size={24} color={theme.colors.primary} /></View>
                      <Text style={[st.actionLbl, { color: theme.colors.text }]}>{a.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={st.section}>
                <Text style={[st.secTitle, { color: theme.colors.text }]}>Métricas Institucionales</Text>
                <View style={[cs.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '50' }]}>
                  <Text style={[cs.title, { color: theme.colors.text }]}>Tendencia de Inscripciones</Text>
                  <LineChart data={{ labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], datasets: [{ data: [12, 19, 14, 25, 22, 30], strokeWidth: 2 }] }} width={cw} height={180} chartConfig={mkCfg(theme, 'rgba(0,122,255,1)')} bezier style={{ borderRadius: 16, marginLeft: -16 }} withInnerLines={false} withOuterLines={false} fromZero />
                </View>
                <View style={[cs.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '50' }]}>
                  <Text style={[cs.title, { color: theme.colors.text }]}>Actividad por Día</Text>
                  <BarChart data={{ labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], datasets: [{ data: [45, 52, 38, 60, 55, 20, 10] }] }} width={cw} height={180} chartConfig={mkCfg(theme, 'rgba(88,86,214,1)')} style={{ borderRadius: 16, marginLeft: -16 }} fromZero showValuesOnTopOfBars yAxisLabel="" yAxisSuffix="" />
                </View>
                <View style={[cs.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border + '50' }]}>
                  <Text style={[cs.title, { color: theme.colors.text }]}>Rendimiento por Aula</Text>
                  <BarChart data={{ labels: ['Aula A', 'Aula B', 'Aula C', 'Aula D'], datasets: [{ data: [78, 85, 72, 90] }] }} width={cw} height={180} chartConfig={mkCfg(theme, 'rgba(52,199,89,1)')} style={{ borderRadius: 16, marginLeft: -16 }} fromZero showValuesOnTopOfBars yAxisLabel="" yAxisSuffix="" />
                </View>
              </View>
            </View>
          )}

          {/* Classrooms Tab */}
          {activeTab === 'classrooms' && (
            <View style={st.tabContent}>
              {cL ? <SkeletonLoader rows={3} variant="card" /> : cls && cls.length > 0 ? cls.map((c: any) => (
                <Pressable key={c.id} style={[st.listCard, { backgroundColor: theme.colors.card }]} onPress={() => router.push(`/admin/institution/${id}/classroom/${c.id}`)}>
                  <View style={[st.listIcon, { backgroundColor: '#FF950015' }]}><Ionicons name="book" size={22} color="#FF9500" /></View>
                  <View style={st.listInfo}><Text style={[st.listName, { color: theme.colors.text }]}>{c.name}</Text><Text style={[st.listSub, { color: theme.colors.textSecondary }]}>{c._count?.students ?? 0} alumnos · {c._count?.projects ?? 0} materias</Text></View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.border} />
                </Pressable>
              )) : <EmptyState icon="book-outline" title="Sin aulas" message="No hay aulas registradas en esta institución." actionLabel="Crear Aula" onAction={() => setClassOptionsVisible(true)} />}
            </View>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <View style={st.tabContent}>
              {uL ? <SkeletonLoader rows={4} variant="list-item" /> : users.length > 0 ? (
                <>
                  {users.map((u: any) => (
                    <Pressable key={u.id} style={[st.listCard, { backgroundColor: theme.colors.card }]}
                      onPress={() => { const b = `/admin/institution/${id}`; if (u.role === 'STUDENT') router.push(`${b}/student/${u.id}`); else if (u.role === 'TEACHER') router.push(`${b}/teacher/${u.id}`); else router.push(`/admin/users/${u.id}` as any); }}>
                      <View style={[st.listIcon, { backgroundColor: '#007AFF15' }]}><Text style={{ fontSize: 16, fontWeight: '700', color: '#007AFF' }}>{u.fullName?.charAt(0) ?? '?'}</Text></View>
                      <View style={st.listInfo}><Text style={[st.listName, { color: theme.colors.text }]}>{u.fullName}</Text><Text style={[st.listSub, { color: theme.colors.textSecondary }]}>{u.email}</Text></View>
                      <View style={[st.roleBadge, { backgroundColor: theme.colors.primary + '15' }]}><Text style={[st.roleText, { color: theme.colors.primary }]}>{u.role}</Text></View>
                    </Pressable>
                  ))}
                  {hN && <Pressable style={[st.loadMore, { borderColor: theme.colors.border }]} onPress={() => fN()}><Text style={[st.loadMoreTxt, { color: theme.colors.primary }]}>Cargar más</Text></Pressable>}
                </>
              ) : <EmptyState icon="people-outline" title="Sin usuarios" message="No hay usuarios registrados en esta institución." />}
            </View>
          )}
        </ScrollView>

        <EnrollmentOptionsModal visible={optionsVisible} onClose={() => setOptionsVisible(false)} onSelectOption={(o) => { setOptionsVisible(false); if (o === 'SINGLE') router.push(`/admin/institution/${id}/enroll-student`); }} />
        <ClassroomOptionsModal visible={classOptionsVisible} onClose={() => setClassOptionsVisible(false)} onSelectOption={(o) => { setClassOptionsVisible(false); if (o === 'SINGLE') setClassManualVisible(true); }} />
        <ClassroomModal visible={classManualVisible} onClose={() => setClassManualVisible(false)} institutionId={id as string} onSuccess={refresh} />
      </ThemedView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { alignSelf: 'flex-start', width: 40, height: 40, justifyContent: 'center' },
  headerSection: { alignItems: 'center', padding: 20, paddingTop: 10 },
  logoBox: { width: 100, height: 100, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoImg: { width: 100, height: 100, borderRadius: 30 },
  instTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  instAddr: { fontSize: 14, marginTop: 4, opacity: 0.7, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 10 },
  statCard: { width: (SCREEN_WIDTH - 30) / 2, padding: 16, borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statContent: { flex: 1 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLbl: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  tabLbl: { fontSize: 12, fontWeight: '600' },
  tabContent: { padding: 20 },
  section: { marginBottom: 24 },
  secTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLbl: { fontSize: 12, fontWeight: '600' },
  listCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, marginBottom: 10 },
  listIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  listInfo: { flex: 1 },
  listName: { fontSize: 15, fontWeight: '700' },
  listSub: { fontSize: 12, marginTop: 2 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 11, fontWeight: '700' },
  loadMore: { alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, marginTop: 8 },
  loadMoreTxt: { fontSize: 14, fontWeight: '600' },
});
