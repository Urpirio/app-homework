# Crear Nueva Aula

**Ruta**: `app/admin/institution/[id]/create-classroom.tsx`
**Ruta de Navegación**: `/admin/institution/{id}/create-classroom`

## Propósito
Permitir la creación de un nuevo grupo o aula dentro de la institución.

## Características
- **Formulario Simple**: Captura el nombre (obligatorio) y una descripción opcional.
- **Validación**: Impide la creación si el nombre está vacío.
- **Feedback**: Toast de éxito y redirección automática.

## Integración con el Backend

### Endpoints Necesarios
- **POST** `/projects`: Crea el aula en el sistema (el backend usa la entidad `Project` para representar Aulas).

### Estructura de Datos
**Cuerpo de la Petición (POST):**
```json
{
  "name": "string",
  "description": "string",
  "color": "string (hex)",
  "institutionId": "string"
}
```

### Requisitos
- Permisos de administrador.
- El backend debe inicializar el aula sin materias ni alumnos asignados por defecto.

## Flujo del Usuario
1. El administrador inicia el proceso desde el Panel de la Institución o el Listado de Aulas.
2. Define el nombre del grupo (ej. "1ero B - Primaria").
3. Agrega una descripción para aclarar la ubicación o el turno.
4. Presiona "Crear Aula" para finalizar.

## Interacciones
- **Atrás**: Cancela y regresa.
- **Crear**: Guarda y regresa.
