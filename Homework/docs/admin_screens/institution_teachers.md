# Listado de Maestros (Institución)

**Ruta**: `app/admin/institution/[id]/teachers.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/teachers`

## Propósito
Visualizar y buscar dentro del cuerpo docente de la institución. Permite acceder a la gestión individual de cada profesor.

## Características
- **Búsqueda Dinámica**: Filtrado por nombre o correo del maestro.
- **Tarjetas de Maestro**: Muestra nombre, especialidad/correo y un avatar genérico o personalizado.
- **Acceso a Detalle**: Navegación al perfil detallado para gestionar sus materias y alumnos asignados.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/institutions/{id}/teachers`: Obtiene la lista de usuarios con rol `TEACHER` vinculados a la institución.

### Estructura de Datos
**Respuesta del Listado:**
```json
[
  {
    "id": "string",
    "fullName": "string",
    "email": "string",
    "specialty": "string (opcional)"
  }
]
```

### Requisitos
- El backend debe asegurar que solo se devuelvan usuarios con el rol adecuado para esta vista.

## Flujo del Usuario
1. El administrador entra desde el Panel de Detalle de la Institución.
2. Busca al profesor por su nombre para verificar si está registrado.
3. Toca en el profesor para ver qué materias está impartiendo o qué alumnos tiene a su cargo.

## Interacciones
- **Detalle de Maestro**: `/admin/institution/{id}/teacher/{teacherId}`
- **Atrás**: Regresa al Detalle de la Institución.
