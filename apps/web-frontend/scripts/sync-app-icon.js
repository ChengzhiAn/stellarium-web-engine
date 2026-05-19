const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const src = path.join(root, 'src/assets/images/lenghu-appLogo.svg')
const assetsDir = path.join(root, 'assets')
const icon = path.join(assetsDir, 'icon.svg')
const splash = path.join(assetsDir, 'splash.svg')
const splashIcon = path.join(assetsDir, 'splash-icon.svg')
const favicon = path.join(root, 'public/favicon.svg')

const SPLASH_SIZE = 2732
const SPLASH_ICON_SIZE = 432
const LOGO_VIEWBOX = 170.08
const LOGO_DISPLAY = 1900
const SPLASH_ICON_DISPLAY = 380

function buildSplashSvg (logoSvg) {
  const inner = logoSvg
    .replace(/<\?xml[^>]*>\s*/gi, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim()

  const scale = LOGO_DISPLAY / LOGO_VIEWBOX
  const cx = LOGO_VIEWBOX / 2
  const cy = LOGO_VIEWBOX / 2
  const origin = SPLASH_SIZE / 2

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SPLASH_SIZE} ${SPLASH_SIZE}">
  <rect width="${SPLASH_SIZE}" height="${SPLASH_SIZE}" fill="#000000"/>
  <g transform="translate(${origin} ${origin}) scale(${scale}) translate(${-cx} ${-cy})">
${inner}
  </g>
</svg>
`
}

function buildSplashIconSvg (logoSvg) {
  const inner = logoSvg
    .replace(/<\?xml[^>]*>\s*/gi, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
    .trim()

  const scale = SPLASH_ICON_DISPLAY / LOGO_VIEWBOX
  const cx = LOGO_VIEWBOX / 2
  const cy = LOGO_VIEWBOX / 2
  const origin = SPLASH_ICON_SIZE / 2

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SPLASH_ICON_SIZE} ${SPLASH_ICON_SIZE}">
  <rect width="${SPLASH_ICON_SIZE}" height="${SPLASH_ICON_SIZE}" fill="#000000"/>
  <g transform="translate(${origin} ${origin}) scale(${scale}) translate(${-cx} ${-cy})">
${inner}
  </g>
</svg>
`
}

if (!fs.existsSync(src)) {
  console.error('Missing app logo:', src)
  process.exit(1)
}

const logoSvg = fs.readFileSync(src, 'utf8')

fs.mkdirSync(assetsDir, { recursive: true })
fs.copyFileSync(src, icon)
fs.writeFileSync(splash, buildSplashSvg(logoSvg), 'utf8')
fs.writeFileSync(splashIcon, buildSplashIconSvg(logoSvg), 'utf8')
fs.copyFileSync(src, favicon)
console.log('Synced lenghu-appLogo.svg -> assets/icon.svg, assets/splash.svg, assets/splash-icon.svg, public/favicon.svg')
