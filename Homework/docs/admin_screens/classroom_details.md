# Detalle del Aula

**Ruta**: `app/admin/institution/[id]/classroom/[classId].tsx`
**Ruta de Navegación**: `/admin/institution/{id}/classroom/{classId}`

## Propósito
Panel de gestión específico para un grupo o aula. Permite ver y añadir las materias que se imparten en este grupo.

## Características
- **Encabezado**: Nombre y descripción del aula.
- **Materias Asignadas**: Listado de asignaturas configuradas para este grupo.
- **Indicadores de Desempeño**: Muestra el promedio general de cada materia dentro de este aula.
- **Añadir Materias**: Botón directo para crear y asignar una nueva materia al aula.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/classrooms/{classId}`: Obtiene la información básica del aula.
- **GET** `/classrooms/{classId}/subjects`: Obtiene las materias vinculadas a esta aula.

### Estructura de Datos
**Respuesta de Materias:**
```json
[
  {
    "id": "string",
    "name": "string",
    "avgGrade": "number"
  }
]
```

### Requisitos
- Lógica de cálculo de promedio por materia/aula en el backend.

## Flujo del Usuario
1. El administrador entra para supervisar el progreso de un grupo específico.
2. Revisa cuáles materias tienen promedios bajos para intervenir.
3. Si falta una materia en el currículo de este grupo, usa el botón "Añadir".
4. Toca en una materia para gestionar tareas y entregas específicas.

## Interacciones
- **Añadir Materia**: `/admin/institution/{id}/classroom/{classId}/add-subject`
- **Detalle de Materia**: `/admin/institution/{id}/classroom/{classId}/subject/{subjectId}`
- **Atrás**: Regresa al listado de aulas.
