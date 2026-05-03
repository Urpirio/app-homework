# Detalle de Chat (Mensajería en Vivo)

**Ruta**: `app/chat/[id].tsx`
**Ruta de Navegación**: `/chat/{id}?type=user|project`

## Propósito
Proporcionar una interfaz de comunicación en tiempo real para el intercambio de mensajes de texto y archivos multimedia entre usuarios o grupos de materia.

## Características
- **Soporte Multimedia**: Envío y recepción de:
  - Imágenes (con visualizador a pantalla completa).
  - Videos (con icono de reproducción).
  - Documentos (con previsualización y apertura externa).
- **Contexto Dinámico**:
  - **Individual**: Muestra el estado "En línea" y permite ir al perfil del colaborador.
  - **Grupal**: Muestra "Chat de Aula" y permite ir al detalle de la materia.
- **Acciones de Mensaje**: Permite copiar texto mediante pulsación larga.
- **Gestión de Historial**: Opción para vaciar el chat (borrado lógico/físico según backend).
- **Interfaz Adaptativa**: El teclado no obstruye la vista del mensaje actual gracias a `KeyboardAvoidingView`.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/messages/{id}` (o `/messages/project/{id}`): Carga el historial completo de la conversación.
- **POST** `/messages/{id}?type=user|project`: Envía un nuevo mensaje.
- **POST** `/uploads`: Sube archivos adjuntos antes de enviar el mensaje.
- **DELETE** `/messages/{id}`: Vacía el historial de la conversación para el usuario.

### Estructura de Datos
**Mensaje:**
```json
{
  "id": "string",
  "text": "string",
  "sender": { "id": "string", "fullName": "string" },
  "attachment": {
    "fileName": "string",
    "fileUrl": "url string",
    "mimeType": "string"
  },
  "createdAt": "date string"
}
```

### Requisitos
- **WebSockets (Próximamente)**: Para una experiencia de "escribiendo..." y recepción instantánea sin refrescar.
- **FormData**: El envío de archivos requiere el uso de `multipart/form-data`.

## Flujo del Usuario
1. El usuario selecciona un contacto o grupo.
2. Escribe un mensaje o adjunta una foto de su tarea.
3. El mensaje aparece instantáneamente en la lista.
4. Si recibe un documento, lo toca para abrirlo y revisarlo.

## Interacciones
- **Perfil/Materia**: Tocar la cabecera redirige al origen.
- **Adjuntar**: Botón "+" abre el selector de archivos/galería.
- **Cerrar**: Regresa a la pestaña de Mensajes.
