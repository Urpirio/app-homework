# Archivos Compartidos

**Ruta**: `app/collaborator/files/[id].tsx`
**Ruta de Navegación**: `/collaborator/files/{id}`

## Propósito
Centralizar y organizar todos los materiales multimedia y documentos que se han intercambiado en un chat específico, facilitando su recuperación posterior.

## Características
- **Organización por Pestañas**:
  - **Imágenes**: Galería de fotos enviadas/recibidas.
  - **Documentos**: Lista de archivos PDF, Word, etc.
- **Visualizador de Imágenes**: Modal de pantalla completa para ver imágenes en detalle.
- **Descarga y Apertura**: Permite descargar archivos al sistema de archivos local y abrirlos con aplicaciones externas del dispositivo.
- **Metadatos**: Muestra el nombre del archivo, fecha de envío y tamaño (KB).

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/messages/{id}/files?type=image`: Obtiene el historial de imágenes compartidas con el usuario `{id}`.
- **GET** `/messages/{id}/files?type=document`: Obtiene el historial de documentos compartidos con el usuario `{id}`.

### Estructura de Datos
**Archivo Compartido:**
```json
{
  "id": "string",
  "fileName": "string",
  "fileUrl": "url string",
  "fileSize": "number (bytes)",
  "createdAt": "date string"
}
```

### Requisitos
- Integración con `expo-file-system` para descargas.
- Integración con `expo-sharing` para abrir archivos en otras apps.

## Flujo del Usuario
1. El alumno recuerda que un compañero le mandó un PDF con la guía de estudio hace dos semanas.
2. En lugar de buscar en el historial de chat interminable, va a "Mensajes" -> Mantener presionado contacto -> "Archivos".
3. Cambia a la pestaña "Documentos".
4. Encuentra la guía y toca en ella para abrirla o compartirla por otro medio.

## Interacciones
- **Atrás**: Regresa a la pestaña de Mensajes.
- **Imagen**: Abre modal de pantalla completa.
- **Documento**: Inicia flujo de descarga y apertura.
