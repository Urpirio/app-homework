# Implementación de Listado de Proyectos y Detalle de Tareas

Esta actualización expande la funcionalidad de la aplicación permitiendo a los usuarios navegar por su lista completa de proyectos y gestionar las tareas específicas de cada uno.

## Nuevas Pantallas

- **`app/projects/index.tsx` (Listado de Proyectos)**:
  - Muestra la lista completa de proyectos del usuario.
  - **Buscador**: Permite filtrar proyectos por nombre en tiempo real.
  - **Acciones**: Botón para añadir nuevos proyectos y navegación de regreso.
- **`app/projects/[id].tsx` (Detalle de Proyecto)**:
  - Muestra información detallada: nombre, descripción extensa y progreso porcentual.
  - **Lista de Tareas**: Visualización de todas las tareas asociadas al proyecto.
  - **FAB (Floating Action Button)**: Botón flotante que ahora abre un **Modal de Creación de Tareas**.

## Nuevas Funcionalidades de Gestión

- **Agregar Tareas**: Mediante el `AddTaskModal`, el usuario puede escribir el título de una nueva tarea. Al guardarla, la lista se actualiza dinámicamente y la barra de progreso se recalcula automáticamente.
- **Acciones de Proyecto**: El botón "más" (ellipsis) ahora abre el `ProjectActionsModal` con opciones para:
  - **Editar**: (Estructura preparada para edición).
  - **Eliminar**: Incluye un **Alert de confirmación** nativo para evitar borrados accidentales. Si se confirma, el proyecto se "elimina" y se navega de regreso al listado.
- **Interactividad de Tareas**: Ahora es posible marcar tareas como completadas o pendientes simplemente tocándolas, lo que actualiza visualmente el estado y el progreso del proyecto en tiempo real.

## Nuevos Componentes de Interfaz

- **`BaseModal.tsx`**: Un componente base para modales animados con efectos de `FadeIn` y `SlideInDown`, proporcionando una experiencia suave y nativa.
- **`AddTaskModal.tsx`**: Formulario simplificado para la creación rápida de tareas.
- **`ProjectActionsModal.tsx`**: Menú de opciones contextuales para la gestión del proyecto.
  - Representa una tarea individual con un checkbox estilizado.
  - Muestra el estado de la tarea (Pendiente, En curso, Listo).
  - Incluye efectos visuales como el tachado del texto cuando la tarea está completada.
  - Soporta fechas de vencimiento.

## Mejoras en la Navegación

- Se ha integrado la navegación dinámica utilizando rutas con parámetros (`[id]`).
- Al pulsar cualquier tarjeta de proyecto (`ProjectCard`) desde el Home o el Listado, el usuario es dirigido al detalle de ese proyecto específico.
- El enlace "Ver todos" del Home ahora redirige correctamente a la pantalla de listado de proyectos.

## Detalles de Diseño

- **Animaciones**: Se han añadido animaciones de entrada laterales (`FadeInLeft`) para las tareas, creando una sensación de carga progresiva.
- **Jerarquía Visual**: Uso de etiquetas de color consistentes entre el listado y el detalle para identificar rápidamente los proyectos.
- **Interacción**: Los botones de retroceso y las acciones rápidas mantienen la coherencia con el sistema de diseño establecido (sin sombras y con formas dinámicas).
