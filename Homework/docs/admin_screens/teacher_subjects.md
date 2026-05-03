# Materias Asignadas (Maestro)

**Ruta**: `app/admin/institution/[id]/teacher/[teacherId]/subjects.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/teacher/{teacherId}/subjects`

## Propósito
Listar todas las asignaturas que un profesor tiene bajo su responsabilidad, permitiendo la navegación a la gestión de tareas y notas de cada una.

## Características
- **Listado Completo**: Muestra todas las materias sin restricciones de cantidad.
- **Información por Materia**: Nombre de la asignatura, el aula a la que pertenece y el número de estudiantes inscritos.
- **Navegación**: Enlace directo al panel de control de la materia dentro de su respectiva aula.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/teachers/{teacherId}/subjects`: Obtiene la lista detallada de materias asignadas.

### Estructura de Datos
**Respuesta del Listado:**
```json
[
  {
    "id": "string",
    "name": "string",
    "classroom": "string",
    "students": "number",
    "classId": "string"
  }
]
```

### Requisitos
- El backend debe realizar un `join` entre las tablas de Profesores, Materias y Aulas.

## Flujo del Usuario
1. El administrador entra desde el perfil del profesor.
2. Identifica una materia específica que desea auditar.
3. Observa cuántos alumnos tiene esa clase.
4. Toca en la materia para entrar al detalle pedagógico (tareas, entregas, etc.).

## Interacciones
- **Detalle de Materia**: `/admin/institution/{id}/classroom/{classId}/subject/{id}`
- **Atrás**: Regresa al perfil del maestro.
