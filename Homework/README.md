# App Homework 📱

¡Bienvenido al repositorio de **App Homework**! Esta es una aplicación móvil desarrollada con **React Native** y **Expo**, utilizando el sistema de enrutamiento basado en archivos (`expo-router`).

## 🚀 Características Principales

Este proyecto está construido sobre un stack moderno y potente, que incluye:

- **Expo & React Native:** Framework principal para desarrollo multiplataforma (iOS, Android, Web).
- **Enrutamiento:** `expo-router` para navegación basada en archivos, y `@react-navigation` integrado.
- **Gestión de Estado y Datos:** `@tanstack/react-query` para fetching asíncrono y caché, y `axios` para peticiones HTTP.
- **Almacenamiento Local:** `expo-secure-store` y `@react-native-async-storage/async-storage`.
- **Integración con Hardware:** 
  - Cámara (`expo-camera`) y selector de imágenes (`expo-image-picker`)
  - Autenticación biométrica (`expo-local-authentication`)
  - Notificaciones push (`expo-notifications`)
  - Geolocalización y portapapeles.
- **Validación:** `zod` para validación de datos seguros.
- **UI & Diseño:** `react-native-reanimated`, `react-native-chart-kit` para gráficos, y `sonner-native` para notificaciones toast.
- **WebSockets:** `socket.io-client` para comunicación en tiempo real.

## ⚙️ Requisitos Previos

Asegúrate de tener instalado en tu entorno de desarrollo:
- [Node.js](https://nodejs.org/es/) (Versión recomendada: 18+ o 20+)
- [npm](https://www.npmjs.com/) o [Yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

## 🛠️ Instalación y Uso

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Urpirio/app-homework.git
   cd app-homework/Homework
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar la aplicación**
   ```bash
   npx expo start
   ```

Al ejecutar el comando de inicio, verás un código QR en la terminal. Puedes escanearlo con la aplicación **Expo Go** en tu dispositivo físico, o presionar `i` / `a` para abrirlo en el simulador de iOS o el emulador de Android.

## 🧪 Pruebas (Testing)

El proyecto incluye configuración de testing con **Jest** y React Native Testing Library.
Para correr las pruebas:

```bash
npm run test
# Para modo vigilancia (watch mode)
npm run test:watch
# Para ver la cobertura (coverage)
npm run test:coverage
```

## 📂 Estructura del Proyecto

- `app/` - Pantallas y rutas de la aplicación (Expo Router).
- `components/` - Componentes de interfaz reutilizables.
- `hooks/` - Custom hooks de React.
- `constants/` - Valores constantes, temas y configuraciones estáticas.
- `assets/` - Imágenes, fuentes y recursos estáticos.
- `__tests__/` - Pruebas unitarias y de integración.
- `utils/` y `validation/` - Funciones de ayuda y esquemas de validación (Zod).

---
*Documentación generada automáticamente por tu asistente DanielBot 🤖🇩🇴*
