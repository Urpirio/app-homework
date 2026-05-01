# Implementación de la Pantalla Principal (Home)

Esta actualización introduce la pantalla principal de la aplicación, diseñada para ofrecer una visión clara de los proyectos y tareas recientes del usuario.

## Nuevos Componentes

- **`HomeHeader.tsx`**: Un encabezado personalizado que muestra el perfil del usuario, un saludo y un botón de notificaciones con indicador de actividad.
- **`ProjectCard.tsx`**: Una tarjeta visual para proyectos que muestra el nombre, el progreso actual (con barra de progreso) y el conteo de tareas completadas.
- **`home.tsx`**: La pantalla principal que integra todos los componentes, utiliza un `ScrollView` para la navegación vertical y mantiene la estética premium con `BackgroundShapes`.

## Funcionalidades Implementadas

- **Proyectos Recientes**: Se muestra una lista de proyectos a los que el usuario ha accedido últimamente, con indicadores visuales de progreso.
- **Resumen de Tareas**: Una sección de estadísticas rápidas que muestra el total de tareas pendientes y completadas.
- **Navegación Fluida**: Se han actualizado los flujos de Login y Registro para dirigir automáticamente al usuario al Home tras una autenticación exitosa.
- **Estética Coherente**: Se utiliza el mismo sistema de diseño (temas, espaciado y formas de fondo) que en las pantallas de inicio de sesión para una experiencia de marca unificada.

## Detalles Técnicos

- **Mock Data**: Se han incluido datos de ejemplo para demostrar el renderizado de múltiples proyectos con diferentes estados de progreso y colores.
- **Animaciones**: Las secciones del Home utilizan animaciones de entrada (`FadeInDown`) y las tarjetas de proyecto utilizan `FadeInRight` con retraso escalonado para un efecto de carga elegante.
- **Responsividad**: El diseño se ajusta según el ancho de la pantalla, aumentando el padding en dispositivos más grandes.
