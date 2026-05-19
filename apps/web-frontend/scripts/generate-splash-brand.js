const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const root = path.join(__dirname, '..')
const splashIcon = path.join(root, 'assets/splash-icon.svg')
const outDir = path.join(root, 'android/app/src/main/res/drawable-nodpi')
const outFile = path.join(outDir, 'splash_brand.png')
const size = 1152

if (!fs.existsSync(splashIcon)) {
  console.error('Missing splash icon source:', splashIcon)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

sharp(splashIcon, { density: 300 })
  .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
  .png()
  .toFile(outFile)
  .then((info) => {
    console.log('Wrote', outFile, info.width + 'x' + info.height)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
