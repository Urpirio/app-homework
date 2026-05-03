# Detalle de Tarea (Vista Estudiante)

**Ruta**: `app/tasks/[id].tsx`
**Ruta de Navegación**: `/tasks/{id}`

## Propósito
Permitir al estudiante consultar los requisitos de una actividad, descargar materiales de apoyo y realizar la entrega de su trabajo.

## Características
- **Información de Tarea**: Título, descripción detallada y fechas clave (inicio y límite).
- **Indicadores de Urgencia**: Colores distintivos para tareas pendientes vs entregadas.
- **Recursos**: Lista de archivos adjuntos subidos por el profesor (guías, lecturas, plantillas).
- **Flujo de Entrega**:
  - Selector de archivos local.
  - Campo para comentarios opcionales al maestro.
  - Botón de envío con estado de carga.
- **Retroalimentación (Feedback)**: Una vez calificada, muestra la nota obtenida y los comentarios del docente.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/tasks/{id}`: Obtiene el detalle de la tarea y la entrega asociada (si existe).
- **POST** `/submissions`: Crea una nueva entrega enviando el archivo y el comentario.

### Estructura de Datos
**Tarea y Entrega:**
```json
{
  "title": "string",
  "description": "string",
  "deadline": "date string",
  "submission": {
    "date": "date string",
    "fileName": "string",
    "grade": "number | null",
    "feedback": "string | null"
  }
}
```

### Requisitos
- Impedir entregas después de la fecha límite (configurable por el docente).
- El archivo de entrega debe persistirse en un almacenamiento seguro (ej. AWS S3 vía backend).

## Flujo del Usuario
1. El alumno recibe una notificación de tarea.
2. Entra al detalle, lee las instrucciones y descarga la "Guía.pdf".
3. Realiza su trabajo y toca en "Subir Tarea".
4. Selecciona su archivo y confirma el envío.
5. Días después, regresa para ver su calificación y el feedback del profesor.

## Interacciones
- **Atrás**: Regresa a la unidad de origen o al calendario.
- **Descargar Recurso**: Abre el link del archivo en el navegador o app de archivos.
- **Enviar**: Ejecuta el proceso de subida.
