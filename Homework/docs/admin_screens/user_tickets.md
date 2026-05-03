# Historial de Tickets (Técnico)

**Ruta**: `app/admin/user/[id]/tickets.tsx`
**Ruta de Navegación**: `/admin/user/{id}/tickets`

## Propósito
Mostrar el registro histórico de todos los casos de soporte atendidos por un técnico específico. Permite auditar el volumen de trabajo y los tipos de problemas resueltos.

## Características
- **Búsqueda**: Filtrado de tickets por título o categoría.
- **Lista de Tickets**: Tarjetas informativas que muestran la categoría, fecha, título y estado (Completado / En Revisión).
- **Indicadores Visuales**: Iconos y colores diferenciados para estados resueltos (verde) y pendientes (naranja).

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/users/{id}/tickets`: Obtiene el listado completo de tickets asignados al técnico.

### Estructura de Datos
**Respuesta del Listado:**
```json
[
  {
    "id": "string",
    "title": "string",
    "date": "string",
    "status": "RESOLVED | IN_PROGRESS",
    "category": "string"
  }
]
```

### Requisitos
- Paginación en el backend si el historial es muy extenso.
- Capacidad de filtrar por estado desde el API (opcional, actualmente se hace en el cliente).

## Flujo del Usuario
1. El administrador accede desde el perfil del técnico.
2. Utiliza la barra de búsqueda para encontrar tickets de una categoría específica (ej. "Acceso").
3. Revisa la carga de trabajo reciente a través de las fechas.
4. Toca un ticket para auditar la descripción y la resolución aplicada.

## Interacciones
- **Detalle de Ticket**: `/admin/user/{id}/ticket/{ticketId}`
- **Hacia atrás**: Regresa al perfil del técnico.
