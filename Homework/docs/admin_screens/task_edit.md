# Editar Tarea

**Ruta**: `app/admin/institution/[id]/classroom/[classId]/subject/[subjectId]/task/[taskId]/edit.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}/task/{taskId}/edit`

## Propósito
Permitir la actualización de los parámetros de una tarea existente, incluyendo instrucciones, fechas de entrega y recursos de apoyo.

## Características
- **Campos Básicos**: Edición de título y descripción (instrucciones).
- **Gestión de Fechas**:
  - Selector de fecha y hora para el inicio.
  - Selector de fecha y hora para la entrega límite.
- **Gestión de Recursos**:
  - Listado de archivos/links actuales.
  - Opción para eliminar recursos obsoletos.
  - Formulario para añadir nuevos recursos (nombre y URL).
- **Validaciones**: Impide guardar si la fecha límite es anterior a la de inicio.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/tasks/{taskId}`: Para precargar la información de la tarea.
- **PUT** `/tasks/{taskId}`: Para enviar el objeto de tarea actualizado.

### Estructura de Datos
**Cuerpo de la Petición (PUT):**
```json
{
  "title": "string",
  "description": "string",
  "startDate": "ISO String",
  "deadline": "ISO String",
  "resources": [
    { "id": "string", "name": "string", "url": "string" }
  ]
}
```

### Requisitos
- Integración con `@react-native-community/datetimepicker`.
- El backend debe notificar a los alumnos si hay cambios críticos (ej. cambio en la fecha límite).

## Flujo del Usuario
1. El administrador entra desde el detalle de la tarea para extender un plazo.
2. Utiliza el selector de fecha para mover el "Límite" unos días más.
3. Agrega un nuevo video tutorial como recurso extra.
4. Presiona "Guardar Cambios".

## Interacciones
- **Atrás**: Regresa sin guardar.
- **Guardar**: Actualiza y regresa.
