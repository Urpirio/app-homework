# Escáner de Contactos (QR)

**Ruta**: `app/collaborator/scanner.tsx`
**Ruta de Navegación**: `/collaborator/scanner`

## Propósito
Proporcionar un método rápido y sin errores para agregar nuevos contactos de estudio mediante la lectura de sus códigos QR de identidad únicos.

## Características
- **Interfaz de Cámara**: Utiliza la cámara del dispositivo para buscar patrones de códigos QR.
- **Marco Guía**: Visualización de un recuadro con esquinas resaltadas para ayudar al usuario a encuadrar el código.
- **Gestión de Permisos**: Solicita acceso a la cámara si aún no ha sido concedido.
- **Confirmación Visual**: Al detectar un código, emite una notificación visual y redirige automáticamente.

## Integración con el Backend

### Endpoints Necesarios
- **POST** `/collaborators/request`: (Se ejecuta indirectamente en la pantalla de destino) Envía la solicitud de conexión usando el código extraído del QR.

### Estructura de Datos
**Dato Extraído:**
- El código QR debe contener una cadena de texto plana correspondiente al `identityCode` del usuario (ej: `HW-X7Y2`).

### Requisitos
- Dependencia de `expo-camera`.
- El código QR generado por cada usuario en su perfil debe ser compatible con este escáner.

## Flujo del Usuario
1. Dos estudiantes se encuentran en persona.
2. Uno abre su perfil y muestra su código QR.
3. El otro entra a Mensajes -> "+" -> "Escanear".
4. Apunta la cámara al código QR.
5. El sistema detecta el código, notifica el éxito y lo lleva de vuelta a la lista de mensajes con el modal de "Confirmar Solicitud" abierto.

## Interacciones
- **Redirección**: `/collaborators` (con el parámetro `scannedCode`)
- **Cerrar**: Regresa a la pestaña de Mensajes.
