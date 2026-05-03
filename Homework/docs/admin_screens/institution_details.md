# Detalle de Institución

**Ruta**: `app/admin/institution/[id].tsx`
**Ruta de Navegación**: `/admin/institution/{id}`

## Propósito
Panel de control centralizado para una institución específica. Desde aquí se gestionan los pilares educativos: Alumnos, Maestros y Aulas (Clases).

## Características
- **Encabezado Institucional**: Logo, nombre y dirección de la escuela.
- **Grilla de Estadísticas**: Acceso rápido y conteo de:
  - Alumnos
  - Maestros
  - Aulas
  - Promedio de Calificaciones
- **Acciones Administrativas**:
  - Añadir Alumno (Individual o Masivo)
  - Nueva Aula
  - Configuración General

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/institutions/{id}`: Obtiene los detalles y estadísticas agregadas de la institución.

### Estructura de Datos
**Respuesta del Detalle:**
```json
{
  "id": "string",
  "name": "string",
  "address": "string",
  "logoUrl": "url",
  "stats": {
    "students": "number",
    "teachers": "number",
    "projects": "number",
    "avgGrade": "number"
  }
}
```

### Requisitos
- Permisos de administrador de la institución o Super Admin.
- El backend debe consolidar los conteos de las tablas relacionadas.

## Flujo del Usuario
1. El administrador entra y ve el estado general de su escuela.
2. Toca en "Alumnos" para ver el listado completo y gestionar inscripciones.
3. Toca en "Aulas" para revisar el progreso de las materias.
4. Utiliza los botones de "Acciones Administrativas" para realizar tareas rápidas sin navegar profundamente.

## Interacciones
- **Listado de Alumnos**: `/admin/institution/{id}/students`
- **Listado de Maestros**: `/admin/institution/{id}/teachers`
- **Listado de Aulas**: `/admin/institution/{id}/classrooms`
- **Inscribir Alumno**: `/admin/institution/{id}/enroll-student`
- **Configuración**: `/admin/institution/{id}/settings`
