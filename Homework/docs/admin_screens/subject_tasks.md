# Listado de Tareas (Materia)

**Ruta**: `app/admin/institution/[id]/classroom/[classId]/subject/[subjectId]/tasks.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}/tasks`

## Propósito
Exhibir el cronograma de actividades y tareas programadas para una materia específica, permitiendo monitorear el nivel de entrega de los estudiantes.

## Características
- **Listado de Tareas**: Muestra el título y la fecha límite de cada actividad.
- **Indicador de Progreso**: Barra visual que indica el porcentaje de alumnos que ya entregaron la tarea (ej. 12/15 entregas).
- **Navegación**: Acceso al detalle profundo de cada tarea para ver las entregas individuales.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/subjects/{subjectId}/tasks`: Obtiene la lista de tareas con sus métricas de cumplimiento.

### Estructura de Datos
**Respuesta del Listado:**
```json
[
  {
    "id": "string",
    "title": "string",
    "deadline": "date string",
    "submissions": "number",
    "total": "number"
  }
]
```

### Requisitos
- El backend debe calcular dinámicamente el conteo de `submissions` comparado con el total de alumnos inscritos en el aula.

## Flujo del Usuario
1. El administrador entra para revisar el calendario de tareas.
2. Identifica tareas con bajo nivel de entrega para consultar con el profesor.
3. Toca en una tarea específica para auditar qué alumnos no han cumplido.

## Interacciones
- **Detalle de Tarea**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}/task/{taskId}`
- **Atrás**: Regresa al detalle de la materia.
