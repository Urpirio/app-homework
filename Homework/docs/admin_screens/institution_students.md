# Listado de Estudiantes (Institución)

**Ruta**: `app/admin/institution/[id]/students.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/students`

## Propósito
Directorio completo de todos los alumnos matriculados en la institución. Es la herramienta principal para la gestión de la población estudiantil.

## Características
- **Búsqueda**: Filtrado por nombre o correo electrónico.
- **Limpieza de Búsqueda**: Botón para resetear los filtros rápidamente.
- **Listado de Estudiantes**: Tarjetas con avatar (o inicial), nombre y correo.
- **Navegación**: Enlace a la ficha técnica de cada estudiante.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/institutions/{id}/students`: Obtiene la lista de usuarios con rol `STUDENT` vinculados a la institución.

### Estructura de Datos
**Respuesta del Listado:**
```json
[
  {
    "id": "string",
    "fullName": "string",
    "email": "string",
    "avatarUrl": "url (opcional)"
  }
]
```

### Requisitos
- Paginación obligatoria debido al potencial volumen de datos.

## Flujo del Usuario
1. El administrador accede para buscar a un alumno específico.
2. Utiliza la barra de búsqueda para encontrarlo por su correo institucional.
3. Toca en el registro para entrar a ver sus calificaciones y datos de contacto de emergencia.

## Interacciones
- **Ficha del Alumno**: `/admin/institution/{id}/student/{studentId}`
- **Atrás**: Regresa al Panel de la Institución.
