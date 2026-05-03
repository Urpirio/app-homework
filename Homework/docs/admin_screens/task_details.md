# Detalle de Tarea (Administración)

**Ruta**: `app/admin/institution/[id]/classroom/[classId]/subject/[subjectId]/task/[taskId].tsx`
**Ruta de Navegación**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}/task/{taskId}`

## Propósito
Auditar una actividad específica, sus instrucciones, recursos adjuntos y el listado de cumplimiento por parte de los estudiantes.

## Características
- **Información de Tarea**: Título, descripción detallada y fechas (inicio y límite).
- **Recursos de Apoyo**: Enlaces a documentos, videos o guías proporcionadas por el maestro.
- **Entregas de Alumnos**: Listado de todos los estudiantes que han enviado su trabajo.
- **Estado de Calificación**: Muestra si la entrega ya tiene nota o está pendiente de revisión.
- **Navegación**: Acceso a la revisión individual de cada entrega.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/tasks/{taskId}`: Obtiene la definición de la tarea y sus recursos.
- **GET** `/tasks/{taskId}/submissions`: Obtiene la lista de entregas realizadas por los alumnos.

### Estructura de Datos
**Respuesta de la Tarea:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "startDate": "date",
  "deadline": "date",
  "resources": [ { "id": "string", "name": "string", "url": "url" } ]
}
```

### Requisitos
- Soporte para visualización/descarga de recursos de apoyo.

## Flujo del Usuario
1. El administrador entra para entender qué se le pidió a los alumnos.
2. Revisa los materiales de apoyo para asegurar calidad pedagógica.
3. Observa el listado de alumnos y detecta quiénes entregaron a tiempo.
4. Toca en "Ver Entrega" para inspeccionar el trabajo de un estudiante específico.

## Interacciones
- **Editar Tarea**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}/task/{taskId}/edit`
- **Ver Entrega**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}/task/{taskId}/submission/{submissionId}`
- **Atrás**: Regresa al listado de tareas.
