# Detalle del Ticket

**Ruta**: `app/admin/user/[id]/ticket/[ticketId].tsx`
**Ruta de Navegación**: `/admin/user/{id}/ticket/{ticketId}`

## Propósito
Presentar toda la información relevante sobre un caso de soporte técnico, incluyendo la descripción del problema, la solución brindada y los actores involucrados.

## Características
- **Estado y Categoría**: Badges que indican el estado actual (Resuelto/Pendiente) y el área del problema.
- **Descripción**: Detalle textual del problema reportado por el usuario.
- **Resolución**: Detalle textual de la solución aplicada por el técnico.
- **Cronología**: Fechas exactas de creación y resolución del caso.
- **Participantes**: Enlaces directos a los perfiles del Usuario Solicitante y del Técnico Asignado.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/auth/profile`: Para obtener el `institutionId` necesario en las navegaciones.
- **GET** `/tickets/{ticketId}`: Obtiene la información completa del ticket.

### Estructura de Datos
**Respuesta del Detalle:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "status": "RESOLVED | IN_PROGRESS",
  "priority": "LOW | MEDIUM | HIGH",
  "createdAt": "string",
  "closedAt": "string",
  "resolution": "string",
  "user": {
    "id": "string",
    "name": "string",
    "role": "STUDENT | TEACHER",
    "avatar": "url"
  },
  "staff": {
    "id": "string",
    "name": "string",
    "role": "string"
  }
}
```

### Requisitos
- Historial de cambios de estado (opcional para el futuro).
- Validación de que el ticket pertenece a la misma institución que el administrador.

## Flujo del Usuario
1. El administrador entra desde el historial de tickets o una reseña.
2. Lee la descripción para entender la queja del usuario.
3. Evalúa si la resolución fue adecuada y en cuánto tiempo se dio.
4. Si hay dudas, navega al perfil del usuario solicitante para ver su historial académico o de reportes.

## Interacciones
- **Perfil del Solicitante**:
  - Estudiante: `/admin/institution/{instId}/student/{userId}`
  - Maestro: `/admin/institution/{instId}/teacher/{userId}`
- **Hacia atrás**: Regresa al historial de tickets.
