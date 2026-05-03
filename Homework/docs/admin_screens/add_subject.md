# Nueva Materia

**Ruta**: `app/admin/institution/[id]/classroom/[classId]/add-subject.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/classroom/{classId}/add-subject`

## Propósito
Configurar una nueva asignatura dentro de un aula y asignar a los profesores responsables de impartirla.

## Características
- **Nombre de Materia**: Campo de texto para el título de la asignatura.
- **Asignación de Maestros**:
  - Buscador de maestros de la institución.
  - Selección múltiple (Mínimo 1, Máximo 3).
  - Contador visual de maestros seleccionados.
- **Validaciones**: Requiere nombre y al menos un maestro.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/institutions/{institutionId}/teachers`: Para obtener el catálogo de maestros disponibles.
- **POST** `/classrooms/{classId}/subjects`: Crea la materia vinculada al aula y a los maestros seleccionados.

### Estructura de Datos
**Cuerpo de la Petición (POST):**
```json
{
  "name": "string",
  "teacherIds": ["string", "string", ...]
}
```

### Requisitos
- Lógica de relación muchos-a-muchos entre Materias y Profesores.
- Validación en el backend del límite de maestros (opcional pero recomendado).

## Flujo del Usuario
1. El administrador entra desde el detalle del aula.
2. Escribe el nombre de la materia (ej. "Álgebra").
3. Busca y selecciona al profesor o profesores que darán esta clase.
4. Presiona "Guardar Materia".

## Interacciones
- **Atrás**: Cancela y regresa al detalle del aula.
- **Guardar**: Registra y regresa.
