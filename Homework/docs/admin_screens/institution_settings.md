# Configuración de la Institución

**Ruta**: `app/admin/institution/[id]/settings.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/settings`

## Propósito
Gestionar los aspectos administrativos críticos de la institución, incluyendo el equipo de administradores y el estado operativo de la entidad.

## Características
- **Acceso a Información Institucional**: Enlace para editar datos básicos (Nombre, Logo).
- **Gestión de Administradores**:
  - Listado de personas con acceso administrativo.
  - Adición de nuevos administradores (vía modal).
  - Eliminación de administradores (vía gesto de pulsación larga).
- **Zona de Peligro**:
  - Opción para desactivar o eliminar la institución.
  - Modales de confirmación para prevenir acciones accidentales.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/institutions/{id}/admins`: Obtiene la lista de usuarios con rol administrativo en la institución.
- **POST** `/institutions/{id}/admins`: (Vía `AdminEnrollmentModal`) para asignar nuevos administradores.
- **DELETE** `/institutions/{id}/admins/{adminId}`: Para revocar accesos administrativos.
- **PATCH/DELETE** `/institutions/{id}`: Para desactivar o borrar la institución.

### Estructura de Datos
**Listado de Administradores:**
```json
[
  {
    "id": "string",
    "fullName": "string",
    "email": "string",
    "role": "Owner | Admin"
  }
]
```

### Requisitos
- Solo el "Owner" o un Administrador Superior debería poder acceder a la Zona de Peligro.
- Lógica de revocación de tokens JWT al eliminar a un administrador.

## Flujo del Usuario
1. El administrador entra para auditar quién tiene acceso al panel.
2. Agrega a un nuevo compañero de equipo usando su correo electrónico.
3. Si alguien deja la institución, mantiene presionado su nombre para eliminar su acceso.
4. Si la institución deja de ser cliente, utiliza la "Zona de Peligro" para darla de baja.

## Interacciones
- **Editar Información**: `/admin/institution/{id}/edit`
- **Dashboard**: Redirección tras desactivar la institución.
