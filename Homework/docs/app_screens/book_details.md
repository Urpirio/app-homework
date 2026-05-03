# Detalle de Obra (Libro)

**Ruta**: `app/book/[id].tsx`
**Ruta de Navegación**: `/book/{id}`

## Propósito
Mostrar la información completa de una obra específica, incluyendo su sinopsis, ubicación física en la biblioteca y opciones para préstamo o lectura digital.

## Características
- **Ficha Técnica**: Autor, editorial, año de publicación y categoría.
- **Sinopsis**: Resumen breve del contenido del libro.
- **Ubicación**: Indica el estante o sección física donde se encuentra el libro dentro de la escuela.
- **Acción Principal**:
  - **Solicitar Préstamo**: Si el libro es físico y está disponible.
  - **Leer Ahora**: Si existe una versión digital (PDF/ePub) asociada.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/library/books/{id}`: Obtiene todos los detalles de la obra.
- **POST** `/library/loans`: Registra una solicitud de préstamo para el usuario autenticado.

### Estructura de Datos
**Detalle de Libro:**
```json
{
  "id": "string",
  "title": "string",
  "author": "string",
  "synopsis": "string",
  "location": "string (ej: Estante A-12)",
  "digitalUrl": "url string | null",
  "available": "boolean"
}
```

### Requisitos
- Validar que el alumno no tenga préstamos vencidos antes de permitir uno nuevo.

## Flujo del Usuario
1. El alumno selecciona un libro de la biblioteca.
2. Lee la sinopsis para confirmar que es el material que necesita.
3. Verifica la ubicación física para ir a buscarlo al descanso.
4. Si el libro tiene versión digital, toca en "Leer Ahora" para abrir el visor integrado.

## Interacciones
- **Atrás**: Regresa al catálogo de la biblioteca.
- **Préstamo/Lectura**: Ejecuta la acción correspondiente según la disponibilidad.
