# Pestaña de Mensajes (Mensajería)

**Ruta**: `app/(tabs)/collaborators.tsx`
**Ruta de Navegación**: `/collaborators`

## Propósito
Centro de comunicación y colaboración. Permite chatear directamente con otros estudiantes/profesores (contactos) y participar en grupos de materias.

## Características
- **Alternador de Pestañas (Directos vs Materias)**:
  - **Directos**: Lista de chats uno-a-uno con colaboradores aceptados.
  - **Materias**: Grupos de chat automáticos basados en las asignaturas inscritas.
- **Buscador**: Filtro rápido de conversaciones por nombre.
- **Acciones Rápidas (Long Press)**: Al mantener presionado un contacto se despliega un modal con accesos directos a:
  - Chat
  - Carpeta de Archivos compartidos
  - Perfil del colaborador
- **FAB Speed Dial (Botón Flotante)**:
  - **Escanear**: Abre el escáner QR para agregar nuevos contactos.
  - **Nuevo Contacto**: Abre un modal para ingresar un código de identidad manual.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/collaborators`: Obtiene la lista de contactos directos y solicitudes pendientes.
- **GET** `/subjects/chats`: Obtiene la lista de grupos de materia.
- **GET** `/collaborators/search/{code}`: Busca un usuario por su código de identidad único.
- **POST** `/collaborators/request`: Envía una solicitud de conexión a otro usuario.

### Estructura de Datos
**Colaborador:**
```json
{
  "id": "string",
  "name": "string",
  "avatar": "url | null",
  "status": "active | pending",
  "lastMessage": "string",
  "unreadCount": "number"
}
```

### Requisitos
- Implementación de WebSockets para la actualización de mensajes y estados de lectura en tiempo real.

## Flujo del Usuario
1. El usuario quiere preguntar algo a un compañero.
2. Usa el buscador para encontrar el chat directo.
3. Si no tiene al compañero, usa el botón "+" -> "Escanear" para agregarlo mediante su código QR personal.
4. Cambia a la pestaña "Materias" para ver anuncios del profesor en el grupo general del aula.

## Interacciones
- **Chat Individual**: `/chat/{id}?type=user`
- **Chat Grupal**: `/chat/{id}?type=project`
- **Escáner**: `/collaborator/scanner`
- **Archivos**: `/collaborator/files/{id}`
- **Perfil**: `/collaborator/{id}`
