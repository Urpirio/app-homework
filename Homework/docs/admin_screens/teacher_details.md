# Perfil del Maestro

**Ruta**: `app/admin/institution/[id]/teacher/[teacherId].tsx`
**Ruta de Navegación**: `/admin/institution/{id}/teacher/{teacherId}`

## Propósito
Proporcionar una vista integral del desempeño y la carga académica de un profesor dentro de la institución. Permite auditar sus materias, alumnos y estadísticas generales.

## Características
- **Información Personal**: Nombre, especialidad, correo, biografía y avatar.
- **Métricas de Desempeño**: Total de alumnos, cantidad de materias impartidas, promedio de notas de sus alumnos y tasa de asistencia.
- **Vista Previa de Materias**: Listado de las primeras materias que imparte, con acceso a ver el historial completo.
- **Comunicación Directa**: Acceso al chat con el profesor.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/teachers/{teacherId}/profile`: Obtiene los datos del perfil, estadísticas y un resumen de materias.

### Estructura de Datos
**Respuesta del Perfil:**
```json
{
  "id": "string",
  "fullName": "string",
  "email": "string",
  "specialty": "string",
  "bio": "string",
  "avatar": "url",
  "stats": {
    "totalStudents": "number",
    "totalSubjects": "number",
    "avgPerformance": "number",
    "attendance": "string"
  },
  "subjects": [
    { "id": "string", "name": "string", "classroom": "string", "students": "number" }
  ]
}
```

### Requisitos
- Lógica de agregación para calcular el `avgPerformance` basado en las notas de todos los alumnos del profesor.

## Flujo del Usuario
1. El administrador accede desde el listado de maestros.
2. Revisa la biografía y especialidad para asegurar que el perfil está completo.
3. Analiza las estadísticas de rendimiento de sus alumnos.
4. Explora las materias asignadas para verificar que la carga horaria sea correcta.
5. Inicia un chat si necesita coordinar alguna actividad académica.

## Interacciones
- **Chat**: `/chat/{teacherId}`
- **Listado Completo de Materias**: `/admin/institution/{id}/teacher/{teacherId}/subjects`
- **Listado de Alumnos Asignados**: `/admin/institution/{id}/teacher/{teacherId}/students`
- **Detalle de Materia**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}`
