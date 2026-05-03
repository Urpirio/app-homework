# Pestaña de Inicio (Student Dashboard)

**Ruta**: `app/(tabs)/home.tsx`
**Ruta de Navegación**: `/home`

## Propósito
Panel principal personalizado para el estudiante. Proporciona una visión rápida de sus pendientes, materias activas y accesos directos a herramientas académicas.

## Características
- **Cabecera Dinámica**: Saludo basado en la hora del día y nombre del usuario.
- **Banner de Resumen**: Muestra el total de tareas pendientes y materias activas.
- **Accesos Directos (Quick Actions)**:
  - **Notas**: Acceso al módulo de calificaciones.
  - **Calendario**: Salto a la pestaña de horarios.
  - **Biblioteca**: Acceso a recursos de lectura.
- **Tareas Próximas**: Listado prioritario de entregas inminentes con indicadores de urgencia (rojo, naranja, verde).

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/auth/profile`: Para mostrar el nombre y avatar del usuario.
- **GET** `/projects`: Para calcular las estadísticas de materias y tareas pendientes (actualmente se deduce del conteo de tareas por proyecto).

### Estructura de Datos
**Estadísticas Sugeridas:**
```json
{
  "pendingTasks": "number",
  "activeSubjects": "number"
}
```

### Requisitos
- Las tareas mostradas deben estar filtradas por "no entregadas" y ordenadas por fecha límite más cercana.

## Flujo del Usuario
1. El estudiante abre la app y ve su resumen diario.
2. Identifica una tarea urgente en el listado de "Tareas Próximas".
3. Toca la tarea para ir directamente a los detalles de la misma.
4. Usa los botones rápidos para revisar sus notas finales del periodo.

## Interacciones
- **Detalle de Tarea**: `/tasks/{id}`
- **Notas**: `/grades`
- **Biblioteca**: `/library`
- **Ver Materias**: `/projects` (Lista completa)
