import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useClassroom } from '@/hooks/api/useClassrooms';
import { AttendanceStatus, useRecordAttendance } from '@/hooks/api/useAttendance';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AttendanceScreen() {
  const { id, classId, subjectId } = useLocalSearchParams<{ id: string; classId: string; subjectId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

  const { data: classroom, isLoading: loadingClassroom } = useClassroom(classId);
  const recordAttendance = useRecordAttendance();

  const students = useMemo(() => classroom?.students || [], [classroom]);

  // Set default status to PRESENT for all students when list loads
  React.useEffect(() => {
    if (students.length > 0 && Object.keys(attendance).length === 0) {
      const initial: Record<string, AttendanceStatus> = {};
      students.forEach((s: any) => {
        initial[s.id] = AttendanceStatus.PRESENT;
      });
      setAttendance(initial);
    }
  }, [students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await recordAttendance.mutateAsync({
        projectId: subjectId,
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

  if (loadingClassroom) {
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
              {classroom?.name} · {classroom?.projects?.find((p: any) => p.id === subjectId)?.name}
            </Text>
          </View>
        </View>

        {/* Date Selector */}
        <Pressable 
          onPress={() => setShowDatePicker(true)}
          style={[styles.dateSelector, { backgroundColor: theme.colors.card }]}
        >
          <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.dateText, { color: theme.colors.text }]}>
            {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
        </Pressable>

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
          data={students}
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
              recordAttendance.isPending && { opacity: 0.6 }
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

function StudentAttendanceItem({ student, status, onStatusChange }: { 
  student: any; 
  status: AttendanceStatus; 
  onStatusChange: (s: AttendanceStatus) => void 
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.studentCard, { backgroundColor: theme.colors.card }]}>
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
        <Text style={[styles.studentName, { color: theme.colors.text }]} numberOfLines={1}>
          {student.fullName}
        </Text>
      </View>

      <View style={styles.statusButtons}>
        <StatusToggle 
          icon="checkmark" 
          activeColor="#34C759" 
          isActive={status === AttendanceStatus.PRESENT} 
          onPress={() => onStatusChange(AttendanceStatus.PRESENT)}
          label="P"
        />
        <StatusToggle 
          icon="close" 
          activeColor="#FF3B30" 
          isActive={status === AttendanceStatus.ABSENT} 
          onPress={() => onStatusChange(AttendanceStatus.ABSENT)}
          label="A"
        />
        <StatusToggle 
          icon="time" 
          activeColor="#FF9500" 
          isActive={status === AttendanceStatus.LATE} 
          onPress={() => onStatusChange(AttendanceStatus.LATE)}
          label="T"
        />
        <StatusToggle 
          icon="document-text" 
          activeColor="#007AFF" 
          isActive={status === AttendanceStatus.EXCUSED} 
          onPress={() => onStatusChange(AttendanceStatus.EXCUSED)}
          label="E"
        />
      </View>
    </View>
  );
}

function StatusToggle({ icon, activeColor, isActive, onPress, label }: any) {
  const { theme } = useTheme();
  return (
    <Pressable 
      onPress={onPress}
      style={[
        styles.statusToggle,
        { backgroundColor: isActive ? activeColor : theme.colors.border + '20' }
      ]}
    >
      <Text style={[styles.statusLabel, { color: isActive ? '#FFF' : theme.colors.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
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
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    gap: 12,
  },
  dateText: { flex: 1, fontSize: 15, fontWeight: '600' },
  listContent: { padding: 20, paddingBottom: 100 },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  studentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  avatar: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImg: { width: 40, height: 40, borderRadius: 12 },
  avatarText: { fontSize: 16, fontWeight: '700' },
  studentName: { fontSize: 15, fontWeight: '600' },
  statusButtons: { flexDirection: 'row', gap: 6 },
  statusToggle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabel: { fontSize: 14, fontWeight: '800' },
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
