# Listado de Materias (Proyectos)

**Ruta**: `app/projects/index.tsx`
**Ruta de Navegación**: `/projects`

## Propósito
Exhibir todas las asignaturas o proyectos en los que el alumno está inscrito. Sirve como el centro académico principal para navegar hacia los contenidos de estudio.

## Características
- **Tarjetas de Materia**: Cada tarjeta muestra:
  - Nombre de la asignatura.
  - Docente titular responsable.
  - Promedio actual del alumno en esa materia.
- **Indicadores de Calificación**: Las notas se colorean dinámicamente (verde para sobresaliente, naranja para regular, rojo para reprobatorio).
- **Iconografía Personalizada**: Cada materia tiene un icono representativo (calculadora para matemáticas, frasco para física, etc.).

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/projects`: Obtiene la lista completa de materias del alumno autenticado.

### Estructura de Datos
**Respuesta del Proyecto:**
```json
[
  {
    "id": "string",
    "name": "string",
    "teacher": "string",
    "grade": "number",
    "color": "hex string",
    "icon": "ionicons name"
  }
]
```

### Requisitos
- El backend debe calcular el promedio de las tareas calificadas para devolver el campo `grade`.

## Flujo del Usuario
1. El alumno quiere estudiar una materia específica.
2. Navega a "Mis Materias" desde el inicio.
3. Identifica su materia por el color o icono.
4. Toca la tarjeta para ver el programa de estudios (unidades).

## Interacciones
- **Detalle de Materia**: `/projects/{id}`
- **Atrás**: Regresa a `/home`
