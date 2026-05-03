# Editar Materia

**Ruta**: `app/admin/institution/[id]/classroom/[classId]/subject/[subjectId]/edit.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}/edit`

## Propósito
Permitir la modificación del nombre de la materia y la actualización del equipo docente asignado.

## Características
- **Nombre de Materia**: Campo para corregir el título de la asignatura.
- **Modificación de Maestros**:
  - Buscador de maestros para añadir nuevos responsables.
  - Posibilidad de desmarcar maestros actuales para revocar su acceso.
  - Límite de 3 maestros por materia.
- **Precarga de Datos**: Recupera la configuración actual de la materia al entrar.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/subjects/{subjectId}/details`: Para cargar el nombre y maestros actuales.
- **PUT** `/subjects/{subjectId}`: Envía la actualización de nombre y la nueva lista de IDs de maestros.

### Estructura de Datos
**Cuerpo de la Petición (PUT):**
```json
{
  "name": "string",
  "teacherIds": ["string", "string", ...]
}
```

### Requisitos
- Al modificar los maestros, el sistema debe asegurar que los nuevos tengan acceso a los recursos existentes de la materia.

## Flujo del Usuario
1. El administrador entra desde el Panel de Detalle de la Materia.
2. Corrige el nombre si hubo un error tipográfico.
3. Añade a un profesor suplente o elimina a uno que ya no imparte la clase.
4. Presiona "Guardar Cambios" y recibe confirmación.

## Interacciones
- **Atrás**: Cancela y regresa.
- **Guardar**: Actualiza y regresa.
