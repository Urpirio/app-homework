/**
 * Review Templates
 *
 * Predefined review templates loaded based on target user role.
 * Each template defines rating dimensions appropriate for the role.
 *
 * Validates: Requirements 16.2, 16.6
 */

export interface ReviewDimension {
  key: string;
  label: string;
  description: string;
}

export interface ReviewTemplate {
  role: string;
  label: string;
  dimensions: ReviewDimension[];
}

export const STUDENT_TEMPLATE: ReviewTemplate = {
  role: 'STUDENT',
  label: 'Evaluación de Estudiante',
  dimensions: [
    {
      key: 'academic',
      label: 'Académico',
      description: 'Rendimiento académico y comprensión de contenidos',
    },
    {
      key: 'behavior',
      label: 'Comportamiento',
      description: 'Conducta en clase y respeto a las normas',
    },
    {
      key: 'participation',
      label: 'Participación',
      description: 'Participación activa en clases y actividades',
    },
    {
      key: 'homework',
      label: 'Tareas',
      description: 'Cumplimiento y calidad de tareas asignadas',
    },
  ],
};

export const TEACHER_TEMPLATE: ReviewTemplate = {
  role: 'TEACHER',
  label: 'Evaluación de Docente',
  dimensions: [
    {
      key: 'teaching_quality',
      label: 'Calidad de Enseñanza',
      description: 'Claridad y efectividad en la transmisión de conocimientos',
    },
    {
      key: 'communication',
      label: 'Comunicación',
      description: 'Comunicación con estudiantes, padres y colegas',
    },
    {
      key: 'curriculum',
      label: 'Adherencia al Currículo',
      description: 'Seguimiento del plan de estudios y objetivos',
    },
    {
      key: 'engagement',
      label: 'Compromiso Estudiantil',
      description: 'Capacidad de motivar y comprometer a los estudiantes',
    },
  ],
};

/**
 * Returns the appropriate review template for a given user role.
 */
export function getReviewTemplate(role: string): ReviewTemplate {
  switch (role) {
    case 'TEACHER':
      return TEACHER_TEMPLATE;
    case 'STUDENT':
    default:
      return STUDENT_TEMPLATE;
  }
}

/**
 * All available templates for the template selector dropdown.
 */
export const ALL_TEMPLATES: ReviewTemplate[] = [STUDENT_TEMPLATE, TEACHER_TEMPLATE];
