# Editar Institución

**Ruta**: `app/admin/institution/[id]/edit.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/edit`

## Propósito
Permitir la actualización de la información básica y la identidad visual (logo) de una institución educativa.

## Características
- **Actualización de Logo**: Selección de imagen desde la galería del dispositivo usando `expo-image-picker`.
- **Formulario de Datos**: Edición del nombre oficial y la dirección física.
- **Validación**: Asegura que los campos obligatorios no estén vacíos.
- **Feedback**: Notificaciones tipo Toast para confirmar el éxito de la operación.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/institutions/{id}`: Para precargar los datos actuales.
- **PUT** `/institutions/{id}`: Para enviar los datos actualizados al servidor.

### Estructura de Datos
**Cuerpo de la Petición (PUT):**
```json
{
  "name": "string",
  "address": "string",
  "logoUrl": "string (base64 o url de almacenamiento)"
}
```

### Requisitos
- Gestión de subida de archivos en el backend (ej. S3, Cloudinary o almacenamiento local).
- Permisos de edición restringidos a administradores autorizados.

## Flujo del Usuario
1. El administrador navega a esta pantalla desde el panel de Configuración.
2. Toca el área del logo si desea cambiar la imagen corporativa.
3. Corrige el nombre o la dirección si es necesario.
4. Presiona "Guardar Cambios".
5. Recibe una confirmación visual y es redirigido automáticamente a la pantalla anterior.

## Interacciones
- **Atrás**: Regresa a la pantalla de Configuración sin guardar.
- **Guardar**: Actualiza y regresa.
