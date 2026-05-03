# Dashboard de Administración (Pestaña)

**Ruta**: `app/(tabs)/admin-dashboard.tsx`
**Ruta de Navegación**: `/admin-dashboard`

## Propósito
Punto de entrada principal para usuarios con privilegios administrativos dentro de la barra de navegación general. Proporciona una vista ejecutiva del estado de la institución.

## Características
- **Control de Acceso**: Si un usuario sin rol administrativo intenta entrar (ej. vía URL directa), se muestra una pantalla de "Acceso Restringido".
- **Métricas Globales**:
  - Total de Estudiantes y Maestros.
  - Cantidad de Aulas activas.
  - Promedio académico general de la institución.
- **Acceso al Directorio**: Botón directo para gestionar usuarios.
- **Herramientas de Super Admin**: Sección condicional que aparece solo para el dueño del sistema, permitiendo gestionar múltiples instituciones.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/auth/profile`: Para validar permisos y obtener el ID de la institución.
- **GET** `/institutions/{id}/stats`: Para obtener los conteos agregados y promedios.

### Estructura de Datos
**Estadísticas de Institución:**
```json
{
  "students": "number",
  "teachers": "number",
  "classrooms": "number",
  "avgGrade": "number"
}
```

### Requisitos
- Este dashboard debe ser el primer lugar donde se noten anomalías institucionales (ej. caída en promedios).

## Flujo del Usuario
1. El administrador toca la pestaña "Admin" en la barra inferior.
2. Observa rápidamente que el número de estudiantes ha aumentado.
3. Toca en "Directorio de Usuarios" para realizar una inscripción masiva.
4. Si es Super Admin, navega al listado de otras escuelas bajo su control.

## Interacciones
- **Usuarios**: `/admin/users`
- **Instituciones**: `/admin/institutions`
- **Inicio**: Redirección a `/home` si el acceso es denegado.
