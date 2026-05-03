# Control de Entregas (Vista Maestro/Admin)

**Ruta**: `app/tasks/[taskId]/submissions.tsx`
**Ruta de Navegación**: `/tasks/{taskId}/submissions`

## Propósito
Permitir a los docentes revisar, descargar y calificar las tareas entregadas por los alumnos de un aula específica.

## Características
- **Listado de Alumnos**: Muestra quién ha entregado y quién no.
- **Badge de Estado**: Diferencia visual entre entregas "Pendientes" y "Calificadas".
- **Panel de Calificación (Modal)**:
  - Visualización del nombre del alumno.
  - Entrada numérica para la nota (0-100).
  - Campo de texto para feedback personalizado.
- **Acceso al Archivo**: Permite abrir el trabajo del alumno directamente desde la lista.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/submissions/task/{taskId}`: Obtiene todas las entregas realizadas para esa tarea específica.
- **PATCH** `/submissions/{id}/grade`: Actualiza la nota y el feedback de una entrega.

### Estructura de Datos
**Entrega Recibida:**
```json
{
  "id": "string",
  "student": { "fullName": "string" },
  "status": "PENDING | GRADED",
  "grade": "number | null",
  "feedback": "string | null",
  "updatedAt": "date string"
}
```

### Requisitos
- Solo usuarios con rol `TEACHER` o `ADMIN` deben tener acceso a esta pantalla.
- La calificación debe disparar una notificación al alumno automáticamente.

## Flujo del Usuario
1. El maestro entra a su materia y selecciona una tarea que ya venció.
2. Toca en "Ver Entregas".
3. Selecciona a un alumno de la lista.
4. Revisa el archivo, asigna un 95 y escribe "Excelente análisis".
5. Guarda y pasa al siguiente alumno.

## Interacciones
- **Calificar**: Abre el modal de edición de nota.
- **Atrás**: Regresa al detalle de la tarea o a la gestión de aula.
