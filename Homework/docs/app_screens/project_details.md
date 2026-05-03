# Detalle de Materia (Programa Académico)

**Ruta**: `app/projects/[id]/index.tsx`
**Ruta de Navegación**: `/projects/{id}`

## Propósito
Presentar el desglose académico de una materia, incluyendo el equipo docente, los compañeros de clase y el progreso por unidades de aprendizaje.

## Características
- **Acceso a Chat Grupal**: Botón prominente para entrar a la conversación colectiva de la materia.
- **Sección de Maestros**: Tarjetas con los docentes asignados y sus roles.
- **Visualización de Alumnos (Facepile)**: Muestra avatares miniatura de los compañeros con opción de ver la lista completa.
- **Unidades de Aprendizaje**: Listado de bloques pedagógicos que incluyen:
  - Título y descripción de la unidad.
  - Conteo de tareas totales del bloque.
  - Barra/Círculo de progreso basado en tareas completadas.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/projects/{id}`: Obtiene la información básica, miembros (maestros y alumnos) y unidades asociadas.

### Estructura de Datos
**Unidad de Aprendizaje:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "progress": "number (0-100)",
  "tasksCount": "number"
}
```

### Requisitos
- Las unidades deben devolverse en el orden secuencial del programa de estudios.

## Flujo del Usuario
1. El alumno entra para ver qué sigue en su plan de estudios.
2. Revisa quién es el maestro titular.
3. Observa su progreso en la unidad actual para motivarse a terminar.
4. Entra al chat grupal para hacer una pregunta a todos sus compañeros.

## Interacciones
- **Chat Grupal**: `/chat/{id}?type=project`
- **Lista de Alumnos**: `/projects/{id}/students`
- **Tareas de la Unidad**: `/projects/{id}/unit/{unitId}`
- **Atrás**: Regresa al listado de materias.
