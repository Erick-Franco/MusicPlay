# MusicPlay

Reproductor de música local para Android construido con **React Native + Expo (SDK 57)**, TypeScript y `expo-audio`.

## Características

- **Biblioteca**: escaneo de audio del dispositivo (`expo-media-library`) y selección manual de archivos (`expo-document-picker`).
- **Reproducción**: play/pause, anterior/siguiente, búsqueda dentro de la canción (seek), volumen y silencio.
- **Modos**: aleatorio (shuffle) y repetición (una / todas).
- **Favoritos**: marca canciones con corazón, persistidas localmente.
- **Playlists**: crear, eliminar, agregar/quitar canciones y reordenar con arrastre (`react-native-reorderable-list`).
- **Playlists inteligentes**: reproducidas recientemente, más escuchadas (contador persistente de reproducciones) y agregadas recientemente.
- **Temporizador de sueño**: detiene la reproducción al cumplirse el tiempo.
- **Mini player y Now Playing**: controles rápidos y pantalla de reproducción con carátula y progreso.
- **Reproducción en segundo plano** con controles en la pantalla de bloqueo (Android).
- **Tema claro/oscuro** automático.

## Requisitos

- Node.js 20+ y npm.
- [Expo CLI](https://docs.expo.dev/) / Android Studio o dispositivo físico para correr la app.
- La reproducción en segundo plano y el escaneo de medios requieren un **development build** (no funciona en Expo Go para estas APIs de media).

## Puesta en marcha

```bash
npm install
npx expo start
```

Desde la salida de `expo start` puedes abrir la app en un emulador Android o escaneando el código QR con Expo Go (limitado). Para un build completo:

```bash
npx expo run:android          # development build
npm run lint                  # eslint
npm run typecheck             # typecheck
npx expo-doctor               # valida la configuración del SDK
```

## Estructura

```
app/                     Rutas con expo-router
  (tabs)/                Pantallas de la barra inferior (Biblioteca, Recientes, Playlists, Favoritos)
  playlist/[id].tsx      Detalle de playlist
  smart-playlist/[type].tsx  Playlists inteligentes
  now-playing.tsx        Pantalla de reproducción
  queue.tsx              Cola de reproducción
components/music/        Componentes del reproductor (MiniPlayer, PlayerControls, SongItem, modales…)
contexts/MusicPlayerContext.tsx  Estado global del reproductor + contexto de estado de reproducción
utils/musicScanner.ts    Escaneo de dispositivos y picker de archivos
utils/storage.ts         Persistencia con AsyncStorage
data/songs.ts            Canciones de ejemplo para desarrollo
constants/theme.ts       Paleta y spacing
```

## Persistencia

Todo se guarda con AsyncStorage bajo la clave `@musicplay/*`: playlists, favoritos, ajustes (volumen), recientes y contadores de reproducción.

## Permisos (Android)

La app solicita únicamente: acceso a audio (`READ_MEDIA_AUDIO`), notificaciones (`POST_NOTIFICATIONS`) y servicio en primer plano para reproducción en segundo plano.

## Nota

El ecualizador fue eliminado porque `expo-audio` no expone una API de ecualización; un EQ real requeriría un módulo nativo adicional (por ejemplo, `react-native-track-player`).
