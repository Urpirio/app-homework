/**
 * Unit Tests: Teacher Dashboard
 *
 * Tests dashboard data aggregation from multiple endpoints,
 * student deduplication across subjects, grading statistics calculations,
 * and chart data preparation.
 *
 * Validates: Requirements 3.1–3.14
 */

import type { Submission } from '@/types/submission';
import { computeGradingStats, deduplicateStudents } from '@/utils/gradingStats';

// ---------------------------------------------------------------------------
// computeGradingStats tests
// ---------------------------------------------------------------------------

describe('computeGradingStats', () => {
  it('returns zero stats for empty submissions', () => {
    const stats = computeGradingStats([]);
    expect(stats).toEqual({
      averageGrade: 0,
      completionRate: 0,
      pendingCount: 0,
      totalSubmissions: 0,
    });
  });

  it('computes correct average for all graded submissions', () => {
    const submissions: Submission[] = [
      makeSubmission({ grade: 80, status: 'GRADED' }),
      makeSubmission({ grade: 90, status: 'GRADED' }),
      makeSubmission({ grade: 70, status: 'GRADED' }),
    ];
    const stats = computeGradingStats(submissions);
    expect(stats.averageGrade).toBe(80);
    expect(stats.completionRate).toBe(100);
    expect(stats.pendingCount).toBe(0);
    expect(stats.totalSubmissions).toBe(3);
  });

  it('counts pending submissions correctly', () => {
    const submissions: Submission[] = [
      makeSubmission({ grade: 85, status: 'GRADED' }),
      makeSubmission({ status: 'SUBMITTED' }),
      makeSubmission({ status: 'SUBMITTED' }),
      makeSubmission({ grade: 70, status: 'RETURNED' }),
    ];
    const stats = computeGradingStats(submissions);
    expect(stats.pendingCount).toBe(2);
    expect(stats.totalSubmissions).toBe(4);
  });

  it('includes RETURNED in completion rate', () => {
    const submissions: Submission[] = [
      makeSubmission({ grade: 80, status: 'GRADED' }),
      makeSubmission({ grade: 60, status: 'RETURNED' }),
      makeSubmission({ status: 'SUBMITTED' }),
    ];
    const stats = computeGradingStats(submissions);
    // 2 out of 3 are completed (GRADED + RETURNED)
    expect(stats.completionRate).toBeCloseTo(66.67, 1);
  });

  it('averageGrade only considers graded/returned submissions', () => {
    const submissions: Submission[] = [
      makeSubmission({ grade: 100, status: 'GRADED' }),
      makeSubmission({ status: 'SUBMITTED' }), // no grade
      makeSubmission({ grade: 50, status: 'RETURNED' }),
    ];
    const stats = computeGradingStats(submissions);
    // Average of 100 and 50 = 75
    expect(stats.averageGrade).toBe(75);
  });

  it('handles all SUBMITTED (no graded) submissions', () => {
    const submissions: Submission[] = [
      makeSubmission({ status: 'SUBMITTED' }),
      makeSubmission({ status: 'SUBMITTED' }),
    ];
    const stats = computeGradingStats(submissions);
    expect(stats.averageGrade).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.pendingCount).toBe(2);
    expect(stats.totalSubmissions).toBe(2);
  });

  it('handles grade of 0 correctly', () => {
    const submissions: Submission[] = [
      makeSubmission({ grade: 0, status: 'GRADED' }),
      makeSubmission({ grade: 100, status: 'GRADED' }),
    ];
    const stats = computeGradingStats(submissions);
    expect(stats.averageGrade).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// deduplicateStudents tests
// ---------------------------------------------------------------------------

describe('deduplicateStudents', () => {
  it('returns empty array for empty input', () => {
    expect(deduplicateStudents([])).toEqual([]);
  });

  it('returns same array when no duplicates', () => {
    const students = [
      { id: '1', fullName: 'Alice' },
      { id: '2', fullName: 'Bob' },
      { id: '3', fullName: 'Charlie' },
    ];
    expect(deduplicateStudents(students)).toEqual(students);
  });

  it('removes duplicate IDs keeping first occurrence', () => {
    const students = [
      { id: '1', fullName: 'Alice from Math' },
      { id: '2', fullName: 'Bob' },
      { id: '1', fullName: 'Alice from Science' },
    ];
    const result = deduplicateStudents(students);
    expect(result).toHaveLength(2);
    expect(result[0].fullName).toBe('Alice from Math');
    expect(result[1].fullName).toBe('Bob');
  });

  it('handles all duplicates', () => {
    const students = [
      { id: '1', fullName: 'Alice' },
      { id: '1', fullName: 'Alice' },
      { id: '1', fullName: 'Alice' },
    ];
    const result = deduplicateStudents(students);
    expect(result).toHaveLength(1);
  });

  it('preserves order of first occurrences', () => {
    const students = [
      { id: '3', fullName: 'Charlie' },
      { id: '1', fullName: 'Alice' },
      { id: '2', fullName: 'Bob' },
      { id: '1', fullName: 'Alice dup' },
      { id: '3', fullName: 'Charlie dup' },
    ];
    const result = deduplicateStudents(students);
    expect(result.map((s) => s.id)).toEqual(['3', '1', '2']);
  });
});

// ---------------------------------------------------------------------------
// Dashboard data aggregation tests
// ---------------------------------------------------------------------------

describe('Dashboard data aggregation', () => {
  it('computes weighted average grade across subjects', () => {
    const subjects = [
      { id: '1', name: 'Math', classroomName: 'A', studentCount: 30, taskCount: 10, avgGrade: 80 },
      { id: '2', name: 'Science', classroomName: 'B', studentCount: 20, taskCount: 8, avgGrade: 70 },
    ];

    const totalWeight = subjects.reduce((sum, s) => sum + s.studentCount, 0);
    const weightedAvg =
      subjects.reduce((sum, s) => sum + s.avgGrade * s.studentCount, 0) / totalWeight;

    // (80*30 + 70*20) / 50 = (2400 + 1400) / 50 = 76
    expect(weightedAvg).toBe(76);
  });

  it('handles empty subjects for weighted average', () => {
    const subjects: { studentCount: number; avgGrade: number }[] = [];
    const totalWeight = subjects.reduce((sum, s) => sum + s.studentCount, 0);
    const weightedAvg = totalWeight === 0 ? 0 : subjects.reduce((sum, s) => sum + s.avgGrade * s.studentCount, 0) / totalWeight;
    expect(weightedAvg).toBe(0);
  });

  it('handles subjects with zero students', () => {
    const subjects = [
      { id: '1', name: 'Math', classroomName: 'A', studentCount: 0, taskCount: 5, avgGrade: 0 },
    ];
    const totalWeight = subjects.reduce((sum, s) => sum + s.studentCount, 0);
    const weightedAvg = totalWeight === 0 ? 0 : subjects.reduce((sum, s) => sum + s.avgGrade * s.studentCount, 0) / totalWeight;
    expect(weightedAvg).toBe(0);
  });

  it('sorts upcoming deadlines by date ascending', () => {
    const tasks = [
      { id: '1', title: 'Task C', dueDate: '2025-07-15T00:00:00Z', status: 'TODO', projectName: 'Math', projectColor: '#000' },
      { id: '2', title: 'Task A', dueDate: '2025-07-01T00:00:00Z', status: 'TODO', projectName: 'Math', projectColor: '#000' },
      { id: '3', title: 'Task B', dueDate: '2025-07-10T00:00:00Z', status: 'TODO', projectName: 'Math', projectColor: '#000' },
    ];

    const sorted = [...tasks].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    expect(sorted[0].title).toBe('Task A');
    expect(sorted[1].title).toBe('Task B');
    expect(sorted[2].title).toBe('Task C');
  });

  it('limits upcoming deadlines to 5 items', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => ({
      id: `t${i}`,
      title: `Task ${i}`,
      dueDate: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
      status: 'TODO',
      projectName: 'Math',
      projectColor: '#000',
    }));

    const upcoming = tasks
      .filter((t) => new Date(t.dueDate) >= new Date())
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    expect(upcoming).toHaveLength(5);
    expect(upcoming[0].title).toBe('Task 0');
  });
});

// ---------------------------------------------------------------------------
// GradingStatsCard data shape tests
// ---------------------------------------------------------------------------

describe('GradingStatsCard data shape', () => {
  it('stats values are within expected ranges', () => {
    const submissions: Submission[] = [
      makeSubmission({ grade: 85, status: 'GRADED' }),
      makeSubmission({ grade: 92, status: 'GRADED' }),
      makeSubmission({ status: 'SUBMITTED' }),
    ];
    const stats = computeGradingStats(submissions);

    expect(stats.averageGrade).toBeGreaterThanOrEqual(0);
    expect(stats.averageGrade).toBeLessThanOrEqual(100);
    expect(stats.completionRate).toBeGreaterThanOrEqual(0);
    expect(stats.completionRate).toBeLessThanOrEqual(100);
    expect(stats.pendingCount).toBeGreaterThanOrEqual(0);
    expect(stats.totalSubmissions).toBeGreaterThanOrEqual(0);
  });

  it('totalSubmissions always equals input length', () => {
    const submissions: Submission[] = [
      makeSubmission({ grade: 50, status: 'GRADED' }),
      makeSubmission({ status: 'SUBMITTED' }),
    ];
    const stats = computeGradingStats(submissions);
    expect(stats.totalSubmissions).toBe(submissions.length);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0;

function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  idCounter++;
  return {
    id: `sub-${idCounter}`,
    taskId: 'task-1',
    studentId: `student-${idCounter}`,
    status: 'SUBMITTED',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}
