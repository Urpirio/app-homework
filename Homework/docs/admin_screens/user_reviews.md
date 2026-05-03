# Reseñas del Servicio

**Ruta**: `app/admin/user/[id]/reviews.tsx`
**Ruta de Navegación**: `/admin/user/{id}/reviews`

## Propósito
Visualizar todas las reseñas y calificaciones que los usuarios (estudiantes/maestros) han dejado sobre la atención brindada por un miembro del equipo de soporte.

## Características
- **Resumen de Calificación**: Muestra el promedio general y el conteo total de reseñas.
- **Lista de Reseñas**: Listado cronológico de comentarios, incluyendo el nombre del usuario, la calificación en estrellas, la fecha y el comentario.
- **Visualización de Estrellas**: Representación gráfica de la calificación (1-5).
- **Acceso a Detalle**: Permite entrar a ver el detalle de cada reseña individual.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/users/{id}/reviews`: Obtiene el listado de reseñas asociadas al ID del técnico de soporte.

### Estructura de Datos
**Respuesta esperada:**
```json
[
  {
    "id": "string",
    "user": "string (Nombre del solicitante)",
    "rating": "number (1-5)",
    "comment": "string",
    "date": "string"
  }
]
```

### Requisitos
- Las reseñas deben estar vinculadas a un ticket cerrado.
- El backend debe calcular el promedio de calificación para el encabezado.

## Flujo del Usuario
1. El administrador entra desde el perfil del técnico de soporte.
2. Observa el resumen global para evaluar el nivel de satisfacción general.
3. Lee los comentarios específicos para entender puntos de mejora o felicitaciones.
4. Toca una reseña que le llame la atención para investigar a qué caso (ticket) pertenece.

## Interacciones
- **Hacia atrás**: Regresa al perfil del técnico.
- **Detalle de Reseña**: `/admin/user/{id}/review/{reviewId}`
