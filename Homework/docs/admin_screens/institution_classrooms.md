# Listado de Aulas

**Ruta**: `app/admin/institution/[id]/classrooms.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/classrooms`

## Propósito
Gestionar los espacios físicos o lógicos (Aulas) donde se imparten las diferentes materias. Permite organizar a los estudiantes por grupos.

## Características
- **Búsqueda**: Filtrado por nombre del aula.
- **Listado de Aulas**: Tarjetas que muestran el nombre del aula y una breve descripción.
- **Navegación**: Acceso al detalle de cada aula para gestionar sus materias asignadas.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/institutions/{id}/classrooms`: Obtiene la lista de aulas vinculadas a la institución.

### Estructura de Datos
**Respuesta del Listado:**
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string"
  }
]
```

### Requisitos
- Las "Aulas" en el código se manejan como `projects` en el backend.

## Flujo del Usuario
1. El administrador entra para ver la organización de los grupos de la escuela.
2. Utiliza la búsqueda para encontrar un aula específica (ej. "6to A").
3. Toca en el aula para configurar qué materias se imparten en ese grupo.

## Interacciones
- **Detalle de Aula**: `/admin/institution/{id}/classroom/{classId}`
- **Atrás**: Regresa al Panel de la Institución.
