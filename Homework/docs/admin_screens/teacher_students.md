# Alumnos del Maestro

**Ruta**: `app/admin/institution/[id]/teacher/[teacherId]/students.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/teacher/{teacherId}/students`

## Propósito
Visualizar el universo total de estudiantes que reciben clases de un profesor específico, facilitando la identificación de alumnos por aula.

## Características
- **Búsqueda**: Filtrado por nombre del alumno o nombre del aula.
- **Tarjetas de Alumno**: Muestra el nombre, aula y correo electrónico.
- **Navegación**: Acceso a la ficha académica individual de cada alumno.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/teachers/{teacherId}/students`: Obtiene la lista única de estudiantes inscritos en todas las materias del profesor.

### Estructura de Datos
**Respuesta del Listado:**
```json
[
  {
    "id": "string",
    "fullName": "string",
    "classroom": "string",
    "email": "string"
  }
]
```

### Requisitos
- Lógica de `DISTINCT` en el backend para no repetir alumnos que toman más de una materia con el mismo profesor.

## Flujo del Usuario
1. El administrador entra para ver a quiénes les da clase un profesor determinado.
2. Filtra por aula (ej. "6to A") para ver solo a los alumnos de ese grupo.
3. Identifica a un alumno y toca sobre él para revisar su ficha personal (notas, asistencia).

## Interacciones
- **Ficha del Alumno**: `/admin/institution/{id}/student/{studentId}`
- **Atrás**: Regresa al perfil del maestro.
