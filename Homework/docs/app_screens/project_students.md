# Compañeros de Clase

**Ruta**: `app/projects/[id]/students.tsx`
**Ruta de Navegación**: `/projects/{id}/students`

## Propósito
Facilitar la conexión entre estudiantes que comparten una misma materia. Permite buscar compañeros y entablar comunicación directa.

## Características
- **Buscador de Alumnos**: Filtro por nombre para localizar rápidamente a un compañero.
- **Estado de Conexión**: Identifica si el alumno ya es un contacto (para chatear) o si aún no se han conectado.
- **Modal de Conexión**: Si no son contactos, permite enviar una solicitud de conexión o ver el perfil académico del compañero.
- **Acceso Directo a Chat**: Si ya son contactos, el ícono de chat lleva directamente a la conversación privada.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/projects/{id}`: Se utiliza para filtrar los miembros con rol `student`.
- **POST** `/collaborators/request`: Para enviar una solicitud de amistad desde el modal.

### Estructura de Datos
**Compañero:**
```json
{
  "id": "string",
  "name": "string",
  "avatar": "url | null",
  "isContact": "boolean"
}
```

### Requisitos
- Por privacidad, no se deben mostrar datos de contacto personales (teléfono/email) hasta que la conexión sea aceptada.

## Flujo del Usuario
1. El alumno entra para buscar a alguien con quien hacer un equipo.
2. Encuentra al compañero mediante el buscador.
3. Si ya son contactos, le escribe directamente.
4. Si no, le envía una solicitud de conexión para poder chatear después.

## Interacciones
- **Chat Privado**: `/chat/{id}?type=user`
- **Perfil Académico**: `/collaborator/{id}`
- **Atrás**: Regresa al detalle de la materia.
