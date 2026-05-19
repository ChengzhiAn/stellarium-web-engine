import { Capacitor } from '@capacitor/core'

const VAR_TOP = '--safe-area-inset-top'
const VAR_BOTTOM = '--safe-area-inset-bottom'

function readEnvInsets () {
  const probe = document.createElement('div')
  probe.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'visibility:hidden',
    'pointer-events:none',
    'padding-top:env(safe-area-inset-top,0px)',
    'padding-bottom:env(safe-area-inset-bottom,0px)'
  ].join(';')
  document.body.appendChild(probe)
  const style = getComputedStyle(probe)
  const top = parseFloat(style.paddingTop) || 0
  const bottom = parseFloat(style.paddingBottom) || 0
  probe.remove()
  return { top, bottom }
}

function setInsets (top, bottom) {
  const root = document.documentElement
  root.style.setProperty(VAR_TOP, `${top}px`)
  root.style.setProperty(VAR_BOTTOM, `${bottom}px`)
}

function syncInsets () {
  const { top, bottom } = readEnvInsets()
  setInsets(top, bottom)
}

export function installNativeSafeAreaInsets () {
  if (!Capacitor.isNativePlatform()) return

  const platform = Capacitor.getPlatform()
  document.documentElement.classList.add('cap-native', `cap-${platform}`)

  syncInsets()
  window.addEventListener('resize', syncInsets)
  const vv = window.visualViewport
  if (vv) {
    vv.addEventListener('resize', syncInsets)
  }
}
