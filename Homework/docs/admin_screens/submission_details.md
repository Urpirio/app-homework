# Revisión de Entrega

**Ruta**: `app/admin/institution/[id]/classroom/[classId]/subject/[subjectId]/task/[taskId]/submission/[submissionId].tsx`
**Ruta de Navegación**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}/task/{taskId}/submission/{submissionId}`

## Propósito
Permitir a los administradores y maestros visualizar el trabajo entregado por un alumno, calificarlo y proporcionar retroalimentación.

## Características
- **Identificación**: Muestra el nombre del alumno, la tarea a la que pertenece y la fecha de entrega.
- **Contenido**: Visualización del mensaje de texto enviado por el alumno y de los archivos adjuntos (imágenes).
- **Calificación Actual**: Muestra la nota y la retroalimentación si ya fue calificada.
- **Editar Calificación**: Botón que abre un modal (`GradeModal`) para asignar o modificar la nota y el comentario.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/submissions/{submissionId}`: Obtiene el detalle de la entrega.
- **PUT** `/submissions/{submissionId}/grade`: (Vía `GradeModal`) para guardar la nota y retroalimentación.

### Estructura de Datos
**Respuesta de la Entrega:**
```json
{
  "id": "string",
  "studentName": "string",
  "taskTitle": "string",
  "content": "string",
  "fileUrl": "url",
  "submittedAt": "date",
  "grade": "number",
  "feedback": "string"
}
```

### Requisitos
- Visualizador de imágenes de alta resolución para leer tareas manuscritas.
- El backend debe validar que la calificación esté dentro del rango permitido (ej. 0-10).

## Flujo del Usuario
1. El administrador/maestro entra desde el listado de entregas de la tarea.
2. Lee el mensaje del alumno y observa la foto del trabajo.
3. Si el trabajo es correcto, toca "Editar Calificación".
4. Ingresa la nota y un comentario de mejora.
5. Presiona "Guardar" y la nota se actualiza en el expediente del alumno.

## Interacciones
- **Modal de Calificación**: `GradeModal` integrado.
- **Atrás**: Regresa al detalle de la tarea.
