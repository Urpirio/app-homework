# Perfil del Colaborador

**Ruta**: `app/collaborator/[id].tsx`
**Ruta de Navegación**: `/collaborator/{id}`

## Propósito
Visualizar el historial académico público y la relación de colaboración con otro usuario del sistema (estudiante o maestro).

## Características
- **Identificación**: Muestra el nombre, rol y la institución del colaborador.
- **Estadísticas Académicas**: Resume el nivel de actividad del usuario (ej. número de materias inscritas y total de tareas entregadas).
- **Materias en Común**: Listado de las asignaturas que ambos usuarios comparten, permitiendo navegar directamente a ellas.
- **Acceso a Chat**: Botón de acceso rápido para iniciar o continuar una conversación privada.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/collaborators/{id}/profile`: Obtiene la información básica del perfil y estadísticas generales.
- **GET** `/collaborators/{id}/common-projects`: Obtiene la lista de proyectos/materias compartidas entre el usuario autenticado y el colaborador.

### Estructura de Datos
**Resumen del Perfil:**
```json
{
  "id": "string",
  "fullName": "string",
  "role": "string",
  "institution": "string",
  "stats": {
    "projects": "number",
    "tasks": "number"
  }
}
```

### Requisitos
- Las estadísticas deben ser públicas o permitidas por la configuración de privacidad del colaborador.

## Flujo del Usuario
1. El alumno ve el nombre de un compañero en el listado de "Alumnos" de una materia.
2. Toca su nombre para ver su "Perfil Académico".
3. Verifica que comparten 3 materias este semestre.
4. Toca el botón de "Chat" para pedirle ayuda con una tarea de una de esas materias comunes.

## Interacciones
- **Chat Privado**: `/chat/{id}?type=user`
- **Detalle de Materia**: `/projects/{id}` (Desde la lista de materias en común)
- **Atrás**: Regresa a la pantalla anterior.
