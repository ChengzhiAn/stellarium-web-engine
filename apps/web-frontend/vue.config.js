const fs = require('fs')
const path = require('path')

function resolveSkydataDir () {
  const preferred = path.resolve(__dirname, '../skydata')
  const fallback = path.resolve(__dirname, '../test-skydata')
  const marker = ['stars', 'properties']
  if (fs.existsSync(path.join(preferred, ...marker))) return preferred
  if (fs.existsSync(path.join(fallback, ...marker))) return fallback
  return preferred
}

module.exports = {
  runtimeCompiler: true,
  // Capacitor WebView loads from app assets; relative paths required unless using a server.url.
  publicPath:
    process.env.CAPACITOR_BUILD === '1'
      ? './'
      : process.env.CDN_ENV
        ? process.env.CDN_ENV
        : '/',

  // Skysource search calls `VUE_APP_NOCTUASKY_API_SERVER + '/api/v1/...'`. In development, leave that env empty
  // so requests stay same-origin; this proxy avoids CORS (api.noctuasky.com only whitelists e.g. localhost:8080).
  devServer: {
    proxy: {
      '/api': {
        target: 'https://api.noctuasky.com',
        changeOrigin: true,
        secure: true
      }
    }
  },

  chainWebpack: config => {
    // workaround taken from webpack/webpack#6642
    config.output
      .globalObject('this')
    // Tell that our main wasm file needs to be loaded by file loader
    config.module
      .rule('mainwasm')
      .test(/stellarium-web-engine\.wasm$/)
      .type('javascript/auto')
      .use('file-loader')
        .loader('file-loader')
        .options({name: '[name].[hash:8].[ext]', outputPath: 'js'})
        .end()
    config.plugin('copy')
      .tap(([pathConfigs]) => {
         const to = pathConfigs[0].to
         pathConfigs[0].force = true // so the original `/public` folder keeps priority
         // add other locations.
         pathConfigs.unshift({
           from: resolveSkydataDir(),
           to: to + '/skydata',
         })
         return [pathConfigs]
       })
  },

  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: true
    }
  }
}
