# Pestaña de Calendario

**Ruta**: `app/(tabs)/calendar.tsx`
**Ruta de Navegación**: `/calendar`

## Propósito
Visualizador de horarios de clases y cronograma de entregas. Permite al usuario organizar su semana escolar día a día.

## Características
- **Selector de Días**: Barra horizontal para cambiar entre los días de la semana (Lun-Dom).
- **Indicador de Actividad**: Los días con tareas pendientes muestran un punto de color bajo el nombre del día.
- **Horario de Clases**: Lista cronológica de materias, horas y aulas para el día seleccionado.
- **Sección de Entregas**: Listado de tareas o exámenes específicos cuya fecha límite coincide con el día seleccionado.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/schedules`: Obtiene la matriz de horarios del alumno.
- **GET** `/tasks/calendar`: Obtiene las fechas de entrega mapeadas por día para el mes/semana actual.

### Estructura de Datos
**Formato de Horario:**
```json
{
  "day": "Lun",
  "classes": [
    { "id": "string", "name": "string", "time": "07:00 - 08:30", "room": "string", "icon": "string" }
  ]
}
```

### Requisitos
- El backend debe devolver el horario específico de la sección/aula a la que pertenece el alumno.

## Flujo del Usuario
1. El usuario entra para saber qué clase le toca a continuación.
2. Selecciona un día futuro (ej. Miércoles) para ver si tiene exámenes programados.
3. Toca en una materia del horario para ir al detalle académico de esa asignatura.

## Interacciones
- **Detalle de Materia**: `/projects/{id}`
- **Detalle de Tarea**: `/tasks/{id}`
