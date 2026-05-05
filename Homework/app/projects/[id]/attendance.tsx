import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { AttendanceStatus, useRecordAttendance } from '@/hooks/api/useAttendance';
import { useProjectMembers, useSubject } from '@/hooks/api/useProjects';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';


/**
 * AttendanceScreen for Teachers
 * 
 * Permite a los docentes pasar lista de los alumnos inscritos en una materia específica.
 */
export default function ProjectAttendanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

  const { data: project, isLoading: loadingProject } = useSubject(id ?? '');
  const { data: members, isLoading: loadingMembers } = useProjectMembers(id ?? '');
  const recordAttendance = useRecordAttendance();

  const students = useMemo(() => {
    if (!members) return [];
    
    const uniqueStudents = new Map();
    members
      .filter((m) => m.role === 'student')
      .forEach((m) => {
        if (!uniqueStudents.has(m.user.id)) {
          uniqueStudents.set(m.user.id, {
            id: m.user.id,
            fullName: m.user.fullName,
            avatarUrl: m.user.avatarUrl,
          });
        }
      });
    
    return Array.from(uniqueStudents.values());
  }, [members]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter((s) => s.fullName.toLowerCase().includes(query));
  }, [students, searchQuery]);

  const summary = useMemo(() => {
    const counts = {
      [AttendanceStatus.PRESENT]: 0,
      [AttendanceStatus.ABSENT]: 0,
      [AttendanceStatus.LATE]: 0,
      [AttendanceStatus.EXCUSED]: 0,
    };
    Object.values(attendance).forEach((status) => {
      counts[status]++;
    });
    return counts;
  }, [attendance]);

  // Set default status to PRESENT for all students when list loads
  useEffect(() => {
    if (students.length > 0 && Object.keys(attendance).length === 0) {
      const initial: Record<string, AttendanceStatus> = {};
      students.forEach((s) => {
        initial[s.id] = AttendanceStatus.PRESENT;
      });
      setAttendance(initial);
    }
  }, [students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const initial: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      initial[s.id] = AttendanceStatus.PRESENT;
    });
    setAttendance(initial);
  };

  const handleSave = async () => {
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await recordAttendance.mutateAsync({
        projectId: id!,
        date: date.toISOString(),
        records,
      });

      Toast.show({
        type: 'success',
        text1: 'Asistencia guardada',
        text2: `Se ha registrado la asistencia para el día ${date.toLocaleDateString()}`,
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo guardar la asistencia',
      });
    }
  };

  const isLoading = loadingProject || loadingMembers;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Pasar Lista</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {project?.name}
            </Text>
          </View>
        </View>

        {/* Summary Header */}
        <View style={styles.summaryContainer}>
          <SummaryCard 
            label="Presentes" 
            count={summary[AttendanceStatus.PRESENT]} 
            color="#34C759" 
          />
          <SummaryCard 
            label="Ausentes" 
            count={summary[AttendanceStatus.ABSENT]} 
            color="#FF3B30" 
          />
          <SummaryCard 
            label="Tardes" 
            count={summary[AttendanceStatus.LATE]} 
            color="#FF9500" 
          />
          <SummaryCard 
            label="Justif." 
            count={summary[AttendanceStatus.EXCUSED]} 
            color="#007AFF" 
          />
        </View>

        {/* Date Selector & Search */}
        <View style={styles.controlsRow}>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateSelectorSmall, { backgroundColor: theme.colors.card }]}
          >
            <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.dateTextSmall, { color: theme.colors.text }]} numberOfLines={1}>
              {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </Text>
          </Pressable>

          <View style={[styles.searchBox, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Buscar..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={handleReset}
            style={[styles.resetBtn, { backgroundColor: theme.colors.card }]}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {/* Student List */}
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <StudentAttendanceItem
              student={item}
              status={attendance[item.id] || AttendanceStatus.PRESENT}
              onStatusChange={(status) => handleStatusChange(item.id, status)}
            />
          )}
        />

        {/* Footer Action */}
        <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
          <Pressable
            onPress={handleSave}
            disabled={recordAttendance.isPending}
            style={[
              styles.saveBtn,
              { backgroundColor: theme.colors.primary },
              recordAttendance.isPending && { opacity: 0.6 },
            ]}
          >
            {recordAttendance.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>Guardar Asistencia</Text>
              </>
            )}
          </Pressable>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, count, color }: { label: string; count: number; color: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.summaryCard, { backgroundColor: color + '15' }]}>
      <Text style={[styles.summaryCount, { color }]}>{count}</Text>
      <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function StudentAttendanceItem({
  student,
  status,
  onStatusChange,
}: {
  student: any;
  status: AttendanceStatus;
  onStatusChange: (s: AttendanceStatus) => void;
}) {
  const { theme } = useTheme();

  return (
    <View 
      style={[
        styles.studentCard, 
        { 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border + '40',
          borderWidth: 1
        }
      ]}
    >
      <View style={styles.studentInfo}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
          {student.avatarUrl ? (
            <Image source={{ uri: student.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {student.fullName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.nameContainer}>
          <Text style={[styles.studentName, { color: theme.colors.text }]} numberOfLines={1}>
            {student.fullName}
          </Text>
          <Text style={[styles.studentLabel, { color: theme.colors.textSecondary }]}>
            Alumno
          </Text>
        </View>
      </View>

      <View style={styles.statusButtons}>
        <StatusToggle
          activeColor="#34C759"
          isActive={status === AttendanceStatus.PRESENT}
          onPress={() => onStatusChange(AttendanceStatus.PRESENT)}
          label="P"
          description="Presente"
        />
        <StatusToggle
          activeColor="#FF3B30"
          isActive={status === AttendanceStatus.ABSENT}
          onPress={() => onStatusChange(AttendanceStatus.ABSENT)}
          label="A"
          description="Ausente"
        />
        <StatusToggle
          activeColor="#FF9500"
          isActive={status === AttendanceStatus.LATE}
          onPress={() => onStatusChange(AttendanceStatus.LATE)}
          label="T"
          description="Tarde"
        />
        <StatusToggle
          activeColor="#007AFF"
          isActive={status === AttendanceStatus.EXCUSED}
          onPress={() => onStatusChange(AttendanceStatus.EXCUSED)}
          label="E"
          description="Justif."
        />
      </View>
    </View>
  );
}

function StatusToggle({ activeColor, isActive, onPress, label, description }: any) {
  const { theme } = useTheme();
  return (
    <View style={styles.toggleContainer}>
      <Pressable
        onPress={onPress}
        style={[
          styles.statusToggle,
          { backgroundColor: isActive ? activeColor : theme.colors.border + '20' },
        ]}
      >
        <Text
          style={[
            styles.statusLabel,
            { color: isActive ? '#FFF' : theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </Pressable>
      <Text style={[styles.statusDescription, { color: theme.colors.textSecondary }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitleContainer: { marginLeft: 10, flex: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 13 },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCount: { fontSize: 18, fontWeight: '900' },
  summaryLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  dateSelectorSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    width: 100,
  },
  dateTextSmall: { fontSize: 13, fontWeight: '700' },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', padding: 0 },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { padding: 20, paddingTop: 0, paddingBottom: 120 },
  studentCard: {
    gap: 8,
    padding: 12,
    borderRadius: 22,
    marginBottom: 10,
  },
  studentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 14 },
  avatarText: { fontSize: 16, fontWeight: '800' },
  nameContainer: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '800', marginBottom: 1 },
  studentLabel: { fontSize: 11, fontWeight: '600' },
  statusButtons: { flexDirection: 'row', gap: 6 },
  toggleContainer: { alignItems: 'center', gap: 2 },
  statusToggle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabel: { fontSize: 13, fontWeight: '900' },
  statusDescription: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
  },
  saveBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
