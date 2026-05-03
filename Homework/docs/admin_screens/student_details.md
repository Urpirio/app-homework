# Ficha del Alumno

**Ruta**: `app/admin/institution/[id]/student/[studentId].tsx`
**Ruta de Navegación**: `/admin/institution/{id}/student/{studentId}`

## Propósito
Expediente digital detallado del estudiante. Centraliza la información académica, de contacto y de tutoría.

## Características
- **Identidad**: Avatar, nombre completo, aula y correo.
- **Estadísticas Académicas**: Promedio actual, tareas completadas vs pendientes y porcentaje de asistencia.
- **Información del Tutor**: Nombre del padre/madre y teléfono de emergencia (con acceso directo a llamada).
- **Boletín de Notas**: Lista de materias cursadas, el profesor que las imparte y la calificación obtenida.
- **Comunicación**: Acceso al chat con el alumno.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/students/{studentId}/profile`: Obtiene el expediente completo con notas y datos de contacto de emergencia.

### Estructura de Datos
**Respuesta del Perfil:**
```json
{
  "id": "string",
  "fullName": "string",
  "email": "string",
  "classroom": "string",
  "avatar": "url",
  "parentName": "string",
  "parentPhone": "string",
  "stats": {
    "avgGrade": "number",
    "completedTasks": "number",
    "pendingTasks": "number",
    "attendance": "string"
  },
  "subjects": [
    { "id": "string", "name": "string", "teacher": "string", "grade": "number" }
  ]
}
```

### Requisitos
- Permisos de administrador de la escuela.
- Integración con el sistema de llamadas del dispositivo para el teléfono del tutor.

## Flujo del Usuario
1. El administrador entra para revisar el progreso de un alumno en riesgo.
2. Analiza las tareas pendientes para entender por qué ha bajado el promedio.
3. Si la situación es crítica, toca el número del tutor para realizar una llamada de inmediato.
4. Consulta el boletín para ver en qué materia específica tiene dificultades el estudiante.

## Interacciones
- **Chat**: `/chat/{studentId}`
- **Atrás**: Regresa al listado de estudiantes.
