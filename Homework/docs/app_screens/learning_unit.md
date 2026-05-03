# Tareas de la Unidad

**Ruta**: `app/projects/[id]/unit/[unitId].tsx`
**Ruta de Navegación**: `/projects/{id}/unit/{unitId}`

## Propósito
Listar todas las actividades y tareas asociadas a una unidad temática específica de una materia.

## Características
- **Listado de Tareas**: Cada tarea muestra su título y estado actual (Pendiente / Completada).
- **Indicador de Estado**: Visualmente se diferencia si la tarea ya fue entregada mediante el componente `TaskItem`.
- **Navegación al Detalle**: Permite profundizar en los requisitos de cada tarea.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/units/{unitId}/tasks`: Obtiene todas las tareas pertenecientes a la unidad para el alumno autenticado.

### Estructura de Datos
**Tarea de Unidad:**
```json
{
  "id": "string",
  "title": "string",
  "status": "todo | done",
  "createdAt": "date string"
}
```

### Requisitos
- El estado `done` debe reflejar si existe una entrega registrada por parte del alumno.

## Flujo del Usuario
1. El alumno entra a la unidad 2 de Matemáticas.
2. Ve que tiene una tarea pendiente ("Examen de límites").
3. Toca la tarea para leer las instrucciones y subir su trabajo.
4. Al volver, la tarea debería marcarse como completada (si el backend lo confirma).

## Interacciones
- **Detalle de Tarea**: `/tasks/{id}`
- **Atrás**: Regresa al detalle de la materia.
