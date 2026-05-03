# Listado de Instituciones

**Ruta**: `app/admin/institutions.tsx`
**Ruta de Navegación**: `/admin/institutions`

## Propósito
Esta pantalla permite a los administradores globales visualizar y gestionar todas las instituciones (escuelas, universidades) registradas en la plataforma. Es el punto de entrada para la gestión multi-tenencia.

## Características
- **Búsqueda**: Filtrado por nombre de institución o dirección.
- **Tarjetas de Institución**: Muestra el logo, nombre, dirección y conteo de usuarios y aulas.
- **Creación de Instituciones**: Botón flotante (FAB) que abre un modal para registrar una nueva entidad educativa.
- **Navegación**: Acceso directo al detalle administrativo de cada institución.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/institutions`: Obtiene la lista de todas las instituciones registradas.
- **POST** `/institutions`: (A través de `InstitutionModal`) para crear nuevas instituciones.

### Estructura de Datos
**Respuesta del Listado:**
```json
[
  {
    "id": "string",
    "name": "string",
    "address": "string",
    "logoUrl": "url (opcional)",
    "_count": {
      "users": "number",
      "projects": "number"
    }
  }
]
```

### Requisitos
- Solo accesible por administradores del sistema (Super Admins).
- Soporte para carga de imágenes (logos) en el servidor.

## Flujo del Usuario
1. El Super Administrador entra a la aplicación y ve la lista de clientes (instituciones).
2. Busca una escuela específica por su nombre.
3. Observa de un vistazo cuántos usuarios y aulas tiene cada una para monitorear el uso.
4. Crea una nueva institución cuando se registra un nuevo cliente.
5. Toca una institución para entrar a gestionar sus alumnos, maestros y aulas.

## Interacciones
- **Detalle de Institución**: `/admin/institution/{id}`
- **Atrás**: Regresa al Dashboard principal.
