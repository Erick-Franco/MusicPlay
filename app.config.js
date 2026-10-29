// Variante de desarrollo: se instala junto a la app normal (otro paquete y nombre).
// Activa con APP_VARIANT=development (lo hace el perfil "development" de eas.json).
const IS_DEV = process.env.APP_VARIANT === "development";

module.exports = ({ config }) => ({
  ...config,
  name: IS_DEV ? "MusicPlay Dev" : config.name,
  scheme: IS_DEV ? "musicplay-dev" : config.scheme,
  android: {
    ...config.android,
    package: IS_DEV ? "com.musicplay.app.dev" : config.android.package,
  },
});
