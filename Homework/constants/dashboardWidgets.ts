/**
 * Dashboard Widget Definitions and Default Layouts
 *
 * Defines the available dashboard widgets and their default ordering per role.
 * User customizations are stored in AsyncStorage and override these defaults.
 *
 * Validates: Requirements 14.10
 */

import { UserRole } from '@/types/auth';

export interface DashboardWidget {
  /** Unique identifier for the widget */
  id: string;
  /** Display title shown in the dashboard */
  title: string;
  /** Whether the widget is visible in the layout */
  visible: boolean;
}

/** All widget IDs available in the system */
export const WIDGET_IDS = {
  STATS_GRID: 'StatsGrid',
  ENROLLMENT_CHART: 'EnrollmentChart',
  GRADE_DISTRIBUTION: 'GradeDistribution',
  ACTIVITY_FEED: 'ActivityFeed',
  TICKET_QUEUE: 'TicketQueue',
  TASK_COMPLETION: 'TaskCompletion',
  RECENT_SUBMISSIONS: 'RecentSubmissions',
} as const;

export type WidgetId = (typeof WIDGET_IDS)[keyof typeof WIDGET_IDS];

/** Human-readable titles for each widget */
export const WIDGET_TITLES: Record<WidgetId, string> = {
  [WIDGET_IDS.STATS_GRID]: 'Estadísticas Generales',
  [WIDGET_IDS.ENROLLMENT_CHART]: 'Tendencia de Inscripciones',
  [WIDGET_IDS.GRADE_DISTRIBUTION]: 'Distribución de Calificaciones',
  [WIDGET_IDS.ACTIVITY_FEED]: 'Actividad Reciente',
  [WIDGET_IDS.TICKET_QUEUE]: 'Cola de Tickets',
  [WIDGET_IDS.TASK_COMPLETION]: 'Completitud de Tareas',
  [WIDGET_IDS.RECENT_SUBMISSIONS]: 'Entregas Recientes',
};

/** Helper to build a widget entry from an ID */
function widget(id: WidgetId, visible = true): DashboardWidget {
  return { id, title: WIDGET_TITLES[id], visible };
}

/**
 * Default widget layouts per role.
 * Order matters — it determines the display order on the dashboard.
 */
export const DEFAULT_LAYOUTS: Record<string, DashboardWidget[]> = {
  [UserRole.SUPER_ADMIN]: [
    widget(WIDGET_IDS.STATS_GRID),
    widget(WIDGET_IDS.ENROLLMENT_CHART),
    widget(WIDGET_IDS.GRADE_DISTRIBUTION),
    widget(WIDGET_IDS.ACTIVITY_FEED),
    widget(WIDGET_IDS.TICKET_QUEUE),
    widget(WIDGET_IDS.TASK_COMPLETION),
    widget(WIDGET_IDS.RECENT_SUBMISSIONS),
  ],
  [UserRole.SCHOOL_ADMIN]: [
    widget(WIDGET_IDS.STATS_GRID),
    widget(WIDGET_IDS.ENROLLMENT_CHART),
    widget(WIDGET_IDS.GRADE_DISTRIBUTION),
    widget(WIDGET_IDS.ACTIVITY_FEED),
    widget(WIDGET_IDS.TASK_COMPLETION),
    widget(WIDGET_IDS.RECENT_SUBMISSIONS),
    widget(WIDGET_IDS.TICKET_QUEUE, false),
  ],
  [UserRole.TEACHER]: [
    widget(WIDGET_IDS.STATS_GRID),
    widget(WIDGET_IDS.GRADE_DISTRIBUTION),
    widget(WIDGET_IDS.TASK_COMPLETION),
    widget(WIDGET_IDS.RECENT_SUBMISSIONS),
    widget(WIDGET_IDS.ACTIVITY_FEED, false),
    widget(WIDGET_IDS.ENROLLMENT_CHART, false),
    widget(WIDGET_IDS.TICKET_QUEUE, false),
  ],
  [UserRole.STUDENT]: [
    widget(WIDGET_IDS.STATS_GRID),
    widget(WIDGET_IDS.TASK_COMPLETION),
    widget(WIDGET_IDS.RECENT_SUBMISSIONS),
    widget(WIDGET_IDS.GRADE_DISTRIBUTION, false),
    widget(WIDGET_IDS.ACTIVITY_FEED, false),
    widget(WIDGET_IDS.ENROLLMENT_CHART, false),
    widget(WIDGET_IDS.TICKET_QUEUE, false),
  ],
  [UserRole.SUPPORT]: [
    widget(WIDGET_IDS.STATS_GRID),
    widget(WIDGET_IDS.TICKET_QUEUE),
    widget(WIDGET_IDS.ACTIVITY_FEED),
    widget(WIDGET_IDS.TASK_COMPLETION, false),
    widget(WIDGET_IDS.RECENT_SUBMISSIONS, false),
    widget(WIDGET_IDS.ENROLLMENT_CHART, false),
    widget(WIDGET_IDS.GRADE_DISTRIBUTION, false),
  ],
};

/**
 * Returns the default layout for a given role.
 * Falls back to SUPER_ADMIN layout for unknown roles.
 */
export function getDefaultLayout(role: string): DashboardWidget[] {
  return DEFAULT_LAYOUTS[role] ?? DEFAULT_LAYOUTS[UserRole.SUPER_ADMIN];
}

/**
 * Builds the AsyncStorage key for a user's dashboard layout.
 */
export function buildLayoutKey(userId: string): string {
  return `dashboard_layout:${userId}`;
}

/**
 * Validates that a layout array contains only known widget IDs
 * and has the correct shape. Returns true if valid.
 */
export function isValidLayout(layout: unknown): layout is DashboardWidget[] {
  if (!Array.isArray(layout)) return false;

  const knownIds = new Set(Object.values(WIDGET_IDS));

  return layout.every(
    (item) =>
      item != null &&
      typeof item === 'object' &&
      typeof (item as DashboardWidget).id === 'string' &&
      knownIds.has((item as DashboardWidget).id as WidgetId) &&
      typeof (item as DashboardWidget).title === 'string' &&
      typeof (item as DashboardWidget).visible === 'boolean'
  );
}
