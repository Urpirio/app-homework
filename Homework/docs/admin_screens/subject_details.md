# Detalle de Materia (Gestión)

**Ruta**: `app/admin/institution/[id]/classroom/[classId]/subject/[subjectId]/index.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}`

## Propósito
Panel de supervisión pedagógica para una asignatura en un aula específica. Permite ver el rendimiento, las tareas y la actividad reciente de los alumnos.

## Características
- **Resumen Estadístico**: Promedio general, total de tareas creadas, volumen de entregas y cantidad de estudiantes.
- **Equipo Docente**: Muestra los maestros asignados a la materia.
- **Actividad Reciente**: Listado de las últimas entregas de tareas por parte de los alumnos, indicando si ya fueron calificadas o están pendientes.
- **Reporte Detallado**: Acceso a reportes exhaustivos de la materia.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/subjects/{subjectId}/details`: Obtiene toda la información agregada, docentes y actividad reciente.

### Estructura de Datos
**Respuesta del Detalle:**
```json
{
  "id": "string",
  "name": "string",
  "teachers": [ { "id": "string", "fullName": "string" } ],
  "stats": {
    "avgGrade": "number",
    "totalTasks": "number",
    "submittedTasks": "number",
    "totalStudents": "number"
  },
  "recentSubmissions": [
    { 
      "id": "string", 
      "studentName": "string", 
      "taskName": "string", 
      "status": "Graded | Pending", 
      "grade": "number | null" 
    }
  ]
}
```

### Requisitos
- El backend debe calcular los promedios en tiempo real o mediante jobs periódicos.

## Flujo del Usuario
1. El administrador entra para auditar el avance de una materia.
2. Verifica si hay muchas tareas pendientes de calificar por parte de los maestros.
3. Observa el promedio grupal para detectar problemas en el proceso de enseñanza.
4. Navega al listado completo de tareas para revisar el cronograma escolar.

## Interacciones
- **Editar Materia**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}/edit`
- **Listado de Tareas**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}/tasks`
- **Atrás**: Regresa al detalle del aula.
