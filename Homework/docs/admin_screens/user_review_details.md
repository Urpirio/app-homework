# Detalle de Reseña

**Ruta**: `app/admin/user/[id]/review/[reviewId].tsx`
**Ruta de Navegación**: `/admin/user/{id}/review/{reviewId}`

## Propósito
Proporcionar una vista profunda de una calificación específica, vinculándola con el usuario que la emitió y el ticket de soporte original.

## Características
- **Información del Emisor**: Nombre y rol del usuario que calificó.
- **Contenido de la Reseña**: Calificación numérica, estrellas y el comentario completo.
- **Vinculación con Ticket**: Muestra los detalles del ticket que generó esta reseña (ID, título, resolución y fecha de cierre).
- **Información del Staff**: Confirma quién fue el técnico que atendió el caso.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/auth/profile`: Para obtener el `institutionId` necesario en las navegaciones.
- **GET** `/reviews/{reviewId}`: Obtiene el detalle completo de la reseña, incluyendo los datos anidados del ticket y el staff.

### Estructura de Datos
**Respuesta del Detalle:**
```json
{
  "id": "string",
  "userId": "string",
  "user": "string",
  "userRole": "STUDENT | TEACHER",
  "rating": "number",
  "comment": "string",
  "date": "string",
  "ticket": {
    "id": "string",
    "title": "string",
    "category": "string",
    "closedDate": "string",
    "resolution": "string"
  },
  "staff": {
    "name": "string",
    "role": "string"
  }
}
```

### Requisitos
- Relación de base de datos entre `Review`, `Ticket` y `User`.

## Flujo del Usuario
1. El administrador entra desde la lista de reseñas.
2. Revisa el comentario del usuario en contexto con la resolución que dio el técnico.
3. Si el comentario es negativo, analiza la "Resolución" del ticket para ver qué falló.
4. Puede saltar al perfil del alumno/maestro que dejó la reseña para contactarlo si es necesario.

## Interacciones
- **Perfil del Usuario emisor**:
  - Estudiante: `/admin/institution/{instId}/student/{userId}`
  - Maestro: `/admin/institution/{instId}/teacher/{userId}`
  - Otros: `/admin/user/{userId}`
