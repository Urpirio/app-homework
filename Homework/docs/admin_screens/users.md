# Directorio de Usuarios

**Ruta**: `app/admin/users.tsx`
**Ruta de Navegación**: `/admin/users`

## Propósito
Esta pantalla sirve como un directorio central para gestionar todos los usuarios registrados en el sistema o dentro de una institución específica. Permite buscar, filtrar por rol y agregar nuevos usuarios.

## Características
- **Listado de Usuarios**: Muestra una lista de usuarios con su nombre, correo y rol.
- **Búsqueda en Tiempo Real**: Filtrado de la lista por nombre o correo electrónico.
- **Filtros por Rol**: Chips interactivos para filtrar por: Todos, Alumnos, Maestros y Soporte.
- **Registro de Usuarios**: Botón flotante (FAB) que abre un modal para registrar nuevos usuarios.
- **Navegación**: Redirección al perfil detallado del usuario según su rol (Estudiante, Maestro o Soporte).

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/auth/profile`: Obtiene el perfil del administrador actual para determinar su `institutionId`.
- **GET** `/institutions/{institutionId}`: Obtiene la lista de usuarios asociados a la institución.
- **POST** `/auth/register`: (A través del modal `UserRegistrationModal`) para crear nuevos usuarios.

### Estructura de Datos
**Respuesta esperada de usuarios:**
```json
[
  {
    "id": "string",
    "fullName": "string",
    "email": "string",
    "role": "STUDENT | TEACHER | SUPPORT | SCHOOL_ADMIN",
    "avatarUrl": "string (opcional)"
  }
]
```

### Requisitos
- Permisos de administrador de escuela o administrador global.
- El backend debe filtrar los usuarios por la institución del administrador que realiza la consulta.

## Flujo del Usuario
1. El administrador entra a la pantalla y ve la lista completa de usuarios de su institución.
2. Utiliza la barra de búsqueda para localizar a alguien específico.
3. Toca un filtro (ej. "Maestros") para ver solo a los docentes.
4. Toca el botón "+" para registrar un nuevo alumno o maestro.
5. Al hacer clic en un usuario, es redirigido a la pantalla de detalles correspondiente.

## Interacciones
- **Hacia atrás**: Regresa a la pantalla anterior.
- **Detalle de Usuario**: 
  - Si es **STUDENT**: `/admin/institution/{instId}/student/{userId}`
  - Si es **TEACHER**: `/admin/institution/{instId}/teacher/{userId}`
  - Otros: `/admin/user/{userId}`
