const fs = require('fs')
const path = require('path')

const target = path.resolve(
  __dirname,
  '../node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/WebViewLocalServer.java'
)

const marker = 'Stellarium HiPS datasets use extensionless "properties" files'
const needle = '        if (path.equals("/") || (!request.getUrl().getLastPathSegment().contains(".") && html5mode)) {'
const patch = `        // ${marker}
        // (for example /skydata/stars/properties). Capacitor's HTML5 mode
        // normally treats extensionless paths as SPA routes and serves
        // index.html, which makes the engine reject the star survey.
        if (path.startsWith("/skydata/") && path.endsWith("/properties")) {
            InputStream responseStream = new LollipopLazyInputStream(handler, request);
            int statusCode = getStatusCode(responseStream, handler.getStatusCode());
            return new WebResourceResponse(
                "text/plain",
                handler.getEncoding(),
                statusCode,
                handler.getReasonPhrase(),
                handler.getResponseHeaders(),
                responseStream
            );
        }

${needle}`

if (!fs.existsSync(target)) {
  console.warn('[patch-capacitor-android] target not found:', target)
  process.exit(0)
}

const source = fs.readFileSync(target, 'utf8')
if (source.includes(marker)) {
  console.log('[patch-capacitor-android] already patched')
  process.exit(0)
}

if (!source.includes(needle)) {
  console.warn('[patch-capacitor-android] patch location not found')
  process.exit(0)
}

fs.writeFileSync(target, source.replace(needle, patch))
console.log('[patch-capacitor-android] patched WebViewLocalServer for skydata properties')
