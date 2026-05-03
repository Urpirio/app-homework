# Biblioteca Escolar

**Ruta**: `app/library.tsx`
**Ruta de Navegación**: `/library`

## Propósito
Ofrecer al estudiante un catálogo digital de recursos literarios, científicos y académicos disponibles en la institución. Permite buscar y filtrar obras para su consulta o préstamo físico.

## Características
- **Buscador Inteligente**: Filtra por título de la obra o nombre del autor en tiempo real.
- **Filtros por Categoría**: Barra de desplazamiento horizontal con temas como Literatura, Ciencia, Historia, Arte y Matemáticas.
- **Vista de Cuadrícula (Grid)**: Presentación visual de los libros con portadas estilizadas y colores distintivos por género.
- **Estado de Disponibilidad**: Indicadores visuales claros para saber si un libro está disponible o prestado actualmente.

## Integración con el Backend

### Endpoints Necesarios
- **GET** `/library/books`: Obtiene el catálogo completo de libros de la institución.
- **GET** `/library/categories`: Obtiene la lista dinámica de géneros/categorías disponibles.

### Estructura de Datos
**Libro:**
```json
{
  "id": "string",
  "title": "string",
  "author": "string",
  "category": "string",
  "available": "boolean",
  "color": "hex string",
  "coverIcon": "ionicons name"
}
```

### Requisitos
- La búsqueda debe realizarse preferiblemente en el servidor si el catálogo es extenso.

## Flujo del Usuario
1. El alumno necesita un libro de "Cálculo".
2. Abre la Biblioteca y usa el buscador o selecciona la categoría "Matemáticas".
3. Localiza el libro "Cálculo Superior" de James Stewart.
4. Nota que el libro está marcado como "Prestado" y decide buscar otro similar o reservarlo.

## Interacciones
- **Detalle de Libro**: `/book/{id}`
- **Atrás**: Regresa al panel de Inicio.
