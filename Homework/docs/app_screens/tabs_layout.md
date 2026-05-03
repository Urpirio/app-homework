# Layout de Pestañas (Tabs)

**Ruta**: `app/(tabs)/_layout.tsx`
**Ruta de Navegación**: `/ (Raíz de la aplicación autenticada)`

## Propósito
Define la estructura de navegación principal de la aplicación mediante una barra inferior dinámica que se adapta según el rol del usuario autenticado.

## Características
- **Navegación Dinámica**: Muestra u oculta la pestaña de "Admin" basándose en el rol del usuario (`SCHOOL_ADMIN` o `SUPER_ADMIN`).
- **Diseño Adaptativo**:
  - **iOS**: Utiliza un fondo con efecto de desenfoque (`BlurView`) para una apariencia premium.
  - **Android**: Fondo sólido basado en el tema activo.
- **Identidad Visual**: Iconos animados (`Ionicons`) que cambian de estado (relleno vs contorno) según la selección.
- **Acceso Directo**: Las pestañas fijas son Inicio, Calendario y Mensajes.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/auth/profile`: Se utiliza al montar el componente para determinar el rol del usuario y renderizar condicionalmente las pestañas.

### Estructura de Datos
**Respuesta del Perfil:**
```json
{
  "role": "STUDENT | TEACHER | SCHOOL_ADMIN | SUPPORT | SUPER_ADMIN"
}
```

### Requisitos
- El token de autenticación debe estar presente en los encabezados para que `api.get('/auth/profile')` funcione correctamente.

## Flujo del Usuario
1. El usuario inicia sesión.
2. El layout se monta y consulta el rol del usuario.
3. Si el usuario es administrador, aparece la cuarta pestaña de "Admin".
4. El usuario navega entre las diferentes secciones manteniendo el estado global de la aplicación.

## Interacciones
- **Inicio**: Cambia a `/home`
- **Calendario**: Cambia a `/calendar`
- **Mensajes**: Cambia a `/collaborators`
- **Admin**: Cambia a `/admin-dashboard`
