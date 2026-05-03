# Perfil de Soporte (Detalle de Usuario)

**Ruta**: `app/admin/user/[id].tsx`
**Ruta de Navegación**: `/admin/user/{id}`

## Propósito
Muestra el perfil detallado de un miembro del equipo de soporte técnico. Permite visualizar sus estadísticas de rendimiento, tickets atendidos y realizar acciones administrativas como editar o eliminar.

## Características
- **Información de Perfil**: Nombre, especialidad, correo y avatar del técnico.
- **Estadísticas**: Resumen de tickets resueltos, tiempo de respuesta promedio y calificación.
- **Historial de Tickets**: Lista de los últimos tickets atendidos con su estado (Resuelto/Pendiente).
- **Acciones Rápidas**: Acceso directo al chat con el técnico.
- **Menú de Opciones**: Modal para editar el perfil o eliminar al miembro de soporte.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/users/{id}/profile`: Obtiene la información detallada del perfil, estadísticas y lista de tickets.
- **DELETE** `/users/{id}`: (Desde el menú de opciones) para eliminar al usuario del sistema.
- **PUT** `/users/{id}`: (A través de `/edit-profile`) para actualizar la información del técnico.

### Estructura de Datos
**Respuesta del Perfil:**
```json
{
  "id": "string",
  "fullName": "string",
  "email": "string",
  "role": "SUPPORT",
  "specialty": "string",
  "avatar": "url",
  "stats": {
    "ticketsSolved": "number",
    "activeAlerts": "number",
    "avgResponse": "string",
    "rating": "number"
  },
  "tickets": [
    {
      "id": "string",
      "title": "string",
      "date": "string",
      "status": "RESOLVED | IN_PROGRESS"
    }
  ]
}
```

### Requisitos
- Solo accesible por administradores de alto nivel.
- El backend debe calcular las estadísticas dinámicamente o tenerlas almacenadas en una tabla de resumen.

## Flujo del Usuario
1. El administrador accede al perfil desde el Directorio o desde un Ticket.
2. Revisa el rendimiento del técnico (calificación y tickets resueltos).
3. Puede ver el historial de tickets y hacer clic en uno para ver los detalles del caso.
4. Puede iniciar un chat directo para dar instrucciones o seguimiento.
5. Utiliza el menú de los tres puntos para editar datos erróneos o dar de baja al usuario.

## Interacciones
- **Chat**: `/chat/{id}`
- **Historial Completo de Tickets**: `/admin/user/{id}/tickets`
- **Historial de Reseñas**: `/admin/user/{id}/reviews`
- **Detalle de Ticket**: `/admin/user/{id}/ticket/{ticketId}`
- **Editar Perfil**: `/edit-profile?userId={id}`
