// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.

import Vue from 'vue'
import _ from 'lodash'
import StelWebEngine from '@/assets/js/stellarium-web-engine.js'
import Moment from 'moment'
import { Capacitor, CapacitorHttp } from '@capacitor/core'

var DDDate = Date
DDDate.prototype.getJD = function () {
  return (this.getTime() / 86400000) + 2440587.5
}

DDDate.prototype.setJD = function (jd) {
  this.setTime((jd - 2440587.5) * 86400000)
}

DDDate.prototype.getMJD = function () {
  return this.getJD() - 2400000.5
}

DDDate.prototype.setMJD = function (mjd) {
  this.setJD(mjd + 2400000.5)
}

const swh = {
  getMainlandMapKey: function () {
    return process.env.VUE_APP_AMAP_WEB_SERVICE_KEY || ''
  },

  getNoctuaSkyApiUrl: function (path) {
    return (process.env.VUE_APP_NOCTUASKY_API_SERVER || '') + path
  },

  fetchJson: function (url) {
    if (Capacitor.isNativePlatform() && /^https?:\/\//.test(url)) {
      return CapacitorHttp.get({ url: url }).then(function (response) {
        if (response.status < 200 || response.status >= 300) {
          throw new Error('HTTP ' + response.status + ': ' + url)
        }
        return typeof response.data === 'string' ? JSON.parse(response.data) : response.data
      })
    }

    return fetch(url).then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + url)
      }
      return response.json()
    })
  },

  isInMainlandChina: function (lat, lng) {
    return lng >= 72.004 && lng <= 137.8347 && lat >= 0.8293 && lat <= 55.8271
  },

  transformChinaLat: function (x, y) {
    const pi = Math.PI
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
    ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0
    ret += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0
    ret += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0
    return ret
  },

  transformChinaLng: function (x, y) {
    const pi = Math.PI
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
    ret += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0
    ret += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0
    ret += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0
    return ret
  },

  wgs84ToGcj02: function (lat, lng) {
    if (!this.isInMainlandChina(lat, lng)) return { lat: lat, lng: lng }

    const pi = Math.PI
    const a = 6378245.0
    const ee = 0.00669342162296594323
    let dLat = this.transformChinaLat(lng - 105.0, lat - 35.0)
    let dLng = this.transformChinaLng(lng - 105.0, lat - 35.0)
    const radLat = lat / 180.0 * pi
    let magic = Math.sin(radLat)
    magic = 1 - ee * magic * magic
    const sqrtMagic = Math.sqrt(magic)
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi)
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi)
    return { lat: lat + dLat, lng: lng + dLng }
  },

  gcj02ToWgs84: function (lat, lng) {
    if (!this.isInMainlandChina(lat, lng)) return { lat: lat, lng: lng }

    const gcj = this.wgs84ToGcj02(lat, lng)
    return { lat: lat * 2 - gcj.lat, lng: lng * 2 - gcj.lng }
  },

  locationToMapLatLng: function (loc) {
    const p = this.wgs84ToGcj02(loc.lat, loc.lng)
    return [p.lat, p.lng]
  },

  mapLatLngToWgs84: function (lat, lng) {
    return this.gcj02ToWgs84(lat, lng)
  },

  initStelWebEngine: function (store, wasmFile, canvasElem, callBackOnDone) {
    StelWebEngine({
      wasmFile: wasmFile,
      canvas: canvasElem,
      translateFn: function (domain, str) {
        return str
        // return i18next.t(str, {ns: domain});
      },
      onReady: function (lstel) {
        store.commit('replaceStelWebEngine', lstel.getTree())
        lstel.onValueChanged(function (path, value) {
          const tree = store.state.stel
          _.set(tree, path, value)
          store.commit('replaceStelWebEngine', tree)
        })
        Vue.prototype.$stel = lstel
        Vue.prototype.$selectionLayer = lstel.createLayer({ id: 'slayer', z: 50, visible: true })
        Vue.prototype.$observingLayer = lstel.createLayer({ id: 'obslayer', z: 40, visible: true })
        Vue.prototype.$skyHintsLayer = lstel.createLayer({ id: 'skyhintslayer', z: 38, visible: true })
        callBackOnDone()
      }
    })
  },

  monthNames: ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],

  astroConstants: {
    // Light time for 1 au in s
    ERFA_AULT: 499.004782,
    // Seconds per day
    ERFA_DAYSEC: 86400.0,
    // Days per Julian year
    ERFA_DJY: 365.25,
    // Astronomical unit in m
    ERFA_DAU: 149597870000
  },

  iconForSkySourceTypes: function (skySourceTypes) {
    // Array sorted by specificity, i.e. the most generic names at the end
    const iconForType = {
      // Stars
      'Pec?': 'star',
      '**?': 'double_star',
      '**': 'double_star',
      'V*': 'variable_star',
      'V*?': 'variable_star',
      '*': 'star',

      // Candidates
      'As?': 'group_of_stars',
      'SC?': 'group_of_galaxies',
      'Gr?': 'group_of_galaxies',
      'C?G': 'group_of_galaxies',
      'G?': 'galaxy',

      // Multiple objects
      reg: 'region_defined_in_the_sky',
      SCG: 'group_of_galaxies',
      ClG: 'group_of_galaxies',
      GrG: 'group_of_galaxies',
      IG: 'interacting_galaxy',
      PaG: 'pair_of_galaxies',
      'C?*': 'open_galactic_cluster',
      'Gl?': 'globular_cluster',
      GlC: 'globular_cluster',
      OpC: 'open_galactic_cluster',
      'Cl*': 'open_galactic_cluster',
      'As*': 'group_of_stars',
      mul: 'multiple_objects',

      // Interstellar matter
      'PN?': 'planetary_nebula',
      PN: 'planetary_nebula',
      SNR: 'planetary_nebula',
      'SR?': 'planetary_nebula',
      ISM: 'interstellar_matter',

      // Galaxies
      PoG: 'part_of_galaxy',
      QSO: 'quasar',
      G: 'galaxy',

      dso: 'deep_sky',

      // Solar System
      Asa: 'artificial_satellite',
      Moo: 'moon',
      Sun: 'sun',
      Pla: 'planet',
      DPl: 'planet',
      Com: 'comet',
      MPl: 'minor_planet',
      SSO: 'minor_planet',

      Con: 'constellation'
    }
    for (const i in skySourceTypes) {
      if (skySourceTypes[i] in iconForType) {
        return process.env.BASE_URL + 'images/svg/target_types/' + iconForType[skySourceTypes[i]] + '.svg'
      }
    }
    return process.env.BASE_URL + 'images/svg/target_types/unknown.svg'
  },

  iconForSkySource: function (skySource) {
    return swh.iconForSkySourceTypes(skySource.types)
  },

  iconForObservation: function (obs) {
    if (obs && obs.target) {
      return this.iconForSkySource(obs.target)
    } else {
      return this.iconForSkySourceTypes(['reg'])
    }
  },

  cleanupOneSkySourceName: function (name, flags) {
    flags = flags || 4
    return Vue.prototype.$stel.designationCleanup(name, flags)
  },

  nameForSkySource: function (skySource) {
    if (!skySource || !skySource.names) {
      return '?'
    }
    return this.cleanupOneSkySourceName(skySource.names[0])
  },

  culturalNameToList: function (cn) {
    const res = []

    const formatNative = function (_cn) {
      if (cn.name_native && cn.name_pronounce) {
        return cn.name_native + ', <i>' + cn.name_pronounce + '</i>'
      }
      if (cn.name_native) {
        return cn.name_native
      }
      if (cn.name_pronounce) {
        return cn.name_pronounce
      }
    }

    const nativeName = formatNative(cn)
    if (cn.user_prefer_native && nativeName) {
      res.push(nativeName)
    }
    if (cn.name_translated) {
      res.push(cn.name_translated)
    }
    if (!cn.user_prefer_native && nativeName) {
      res.push(nativeName)
    }
    return res
  },

  namesForSkySource: function (ss, flags) {
    // Return a list of cleaned up names
    if (!ss || !ss.names) {
      return []
    }
    if (!flags) flags = 10
    let res = []
    if (ss.culturalNames) {
      for (const i in ss.culturalNames) {
        res = res.concat(this.culturalNameToList(ss.culturalNames[i]))
      }
    }
    res = res.concat(ss.names.map(n => Vue.prototype.$stel.designationCleanup(n, flags)))
    // Remove duplicates, this can happen between * and V* catalogs
    res = res.filter(function (v, i) { return res.indexOf(v) === i })
    res = res.filter(function (v, i) { return !v.startsWith('CON ') })
    return res
  },

  nameForSkySourceType: function (otype) {
    const $stel = Vue.prototype.$stel
    const res = $stel.otypeToStr(otype)
    return res || 'Unknown Type'
  },

  nameForGalaxyMorpho: function (morpho) {
    const galTab = {
      E: 'Elliptical',
      SB: 'Barred Spiral',
      SAB: 'Intermediate Spiral',
      SA: 'Spiral',
      S0: 'Lenticular',
      S: 'Spiral',
      Im: 'Irregular',
      dSph: 'Dwarf Spheroidal',
      dE: 'Dwarf Elliptical'
    }
    for (const morp in galTab) {
      if (morpho.startsWith(morp)) {
        return galTab[morp]
      }
    }
    return ''
  },

  getShareLink: function (context) {
    let link = 'https://stellarium-web.org/'
    if (context.$store.state.selectedObject) {
      link += 'skysource/' + this.cleanupOneSkySourceName(context.$store.state.selectedObject.names[0], 5).replace(/\s+/g, '')
    }
    link += '?'
    link += 'fov=' + (context.$store.state.stel.fov * 180 / Math.PI).toPrecision(5)
    const d = new Date()
    d.setMJD(context.$stel.core.observer.utc)
    link += '&date=' + new Moment(d).utc().format()
    link += '&lat=' + (context.$stel.core.observer.latitude * 180 / Math.PI).toFixed(2)
    link += '&lng=' + (context.$stel.core.observer.longitude * 180 / Math.PI).toFixed(2)
    link += '&elev=' + context.$stel.core.observer.elevation
    if (!context.$store.state.selectedObject) {
      link += '&az=' + (context.$stel.core.observer.yaw * 180 / Math.PI).toPrecision(5)
      link += '&alt=' + (context.$stel.core.observer.pitch * 180 / Math.PI).toPrecision(5)
    }
    return link
  },

  // Return a SweObj matching a passed sky source JSON object if it's already instanciated in SWE
  skySource2SweObj: function (ss) {
    if (!ss || !ss.model) {
      return undefined
    }
    const $stel = Vue.prototype.$stel
    let obj
    if (ss.model === 'tle_satellite') {
      const id = 'NORAD ' + ss.model_data.norad_number
      obj = $stel.getObj(id)
    } else if (ss.model === 'constellation' && ss.model_data.iau_abbreviation) {
      const id = 'CON western ' + ss.model_data.iau_abbreviation
      obj = $stel.getObj(id)
    }
    if (!obj) {
      obj = $stel.getObj(ss.names[0])
    }
    if (!obj && ss.names[0].startsWith('Gaia DR2 ')) {
      const gname = ss.names[0].replace(/^Gaia DR2 /, 'GAIA ')
      obj = $stel.getObj(gname)
    }
    if (obj === null) return undefined
    return obj
  },

  lookupSkySourceByName: function (name) {
    const url = this.getNoctuaSkyApiUrl('/api/v1/skysources/name/' + encodeURIComponent(name))
    return this.fetchJson(url)
  },

  // Clone + fixups from engine JSON (same shape as NoctuaSky skysource). Used when API fails
  // and to show the selection panel immediately before the first network round-trip.
  normalizeSkySourceFromSweObj: function (obj) {
    if (!obj || !obj.jsonData) return null
    const ss = JSON.parse(JSON.stringify(obj.jsonData))
    if (!ss.model_data) {
      ss.model_data = {}
    }
    for (const i in ss.names || []) {
      if (ss.names[i].startsWith('GAIA')) {
        ss.names[i] = ss.names[i].replace(/^GAIA /, 'Gaia DR2 ')
      }
    }
    ss.culturalNames = obj.culturalDesignations()
    return ss
  },

  // First HTTPS request to NoctuaSky pays DNS+TLS; warm it during idle time after startup.
  warmNoctuaSkyApiConnection: function () {
    try {
      this.querySkySources('Sun', 1).catch(function () {})
    } catch (e) {}
  },

  querySkySources: function (str, limit) {
    if (!limit) {
      limit = 10
    }
    const url = this.getNoctuaSkyApiUrl('/api/v1/skysources/?q=' + encodeURIComponent(str) + '&limit=' + encodeURIComponent(limit))
    return this.fetchJson(url)
  },

  sweObj2SkySource: function (obj) {
    const names = obj.designations()
    const that = this

    if (!names || !names.length) {
      throw new Error("Can't find object without names")
    }

    // Several artifical satellites share the same common name, so we use
    // the unambiguous NORAD number instead
    for (const j in names) {
      if (names[j].startsWith('NORAD ')) {
        const tmpName = names[0]
        names[0] = names[j]
        names[j] = tmpName
      }
    }

    const printErr = function (n) {
      console.log("Couldn't find online skysource data for name: " + n)

      const ss = that.normalizeSkySourceFromSweObj(obj)
      if (!ss) {
        return Promise.reject(new Error("Can't build local skysource data"))
      }
      return ss
    }

    return that.lookupSkySourceByName(names[0]).then(res => {
      return res
    }, () => {
      if (names.length === 1) return printErr(names)
      return that.lookupSkySourceByName(names[1]).then(res => {
        return res
      }, () => {
        if (names.length === 2) return printErr(names)
        return that.lookupSkySourceByName(names[2]).then(res => {
          return res
        }, () => {
          return printErr(names[2])
        })
      })
    }).then(res => {
      res.culturalNames = obj.culturalDesignations()
      return res
    })
  },

  setSweObjAsSelection: function (obj) {
    const $stel = Vue.prototype.$stel
    $stel.core.selection = obj
    $stel.pointAndLock(obj)
  },

  // Get data for a SkySource from wikipedia
  getSkySourceSummaryFromWikipedia: function (ss) {
    if (process.env.VUE_APP_DISABLE_WIKIPEDIA === '1' || process.env.VUE_APP_DISABLE_WIKIPEDIA === 'true') {
      return Promise.resolve(null)
    }
    let title
    if (ss.model === 'jpl_sso') {
      title = this.cleanupOneSkySourceName(ss.names[0]).toLowerCase()
      if (['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'neptune', 'pluto'].indexOf(title) > -1) {
        title = title + '_(planet)'
      }
      if (ss.types[0] === 'Moo') {
        title = title + '_(moon)'
      }
    }
    if (ss.model === 'mpc_asteroid') {
      title = this.cleanupOneSkySourceName(ss.names[0]).toLowerCase()
    }
    if (ss.model === 'constellation') {
      title = this.cleanupOneSkySourceName(ss.names[0]).toLowerCase() + '_(constellation)'
    }
    if (ss.model === 'dso') {
      for (const i in ss.names) {
        if (ss.names[i].startsWith('M ')) {
          title = 'Messier_' + ss.names[i].substr(2)
          break
        }
        if (ss.names[i].startsWith('NGC ')) {
          title = ss.names[i]
          break
        }
        if (ss.names[i].startsWith('IC ')) {
          title = ss.names[i]
          break
        }
      }
    }
    if (ss.model === 'star') {
      for (const i in ss.names) {
        if (ss.names[i].startsWith('* ')) {
          title = this.cleanupOneSkySourceName(ss.names[i])
          break
        }
      }
    }
    if (!title) return Promise.reject(new Error("Can't find wikipedia compatible name"))

    return fetch('https://en.wikipedia.org/w/api.php?action=query&redirects&prop=extracts&exintro&exlimit=1&exchars=300&format=json&origin=*&titles=' + title,
      { headers: { 'Content-Type': 'application/json; charset=UTF-8' } })
      .then(response => {
        return response.json()
      })
  },

  getGeolocation: function () {
    console.log('Getting geolocalization')

    const normalizePos = function (lat, lng, accuracy) {
      if (typeof lat !== 'number' || typeof lng !== 'number' || !isFinite(lat) || !isFinite(lng)) return null
      if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return null
      return { lat: lat, lng: lng, accuracy: accuracy }
    }

    const fetchAmapIpLocation = function () {
      const amapKey = swh.getMainlandMapKey()
      if (!amapKey) return Promise.resolve(null)

      return fetch('https://restapi.amap.com/v3/ip?key=' + encodeURIComponent(amapKey), { credentials: 'omit' })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('AMap IP HTTP ' + r.status)) })
        .then(function (data) {
          if (data.status !== '1' || !data.rectangle) return null

          const corners = data.rectangle.split(';').map(function (p) {
            const pair = p.split(',')
            return { lng: Number(pair[0]), lat: Number(pair[1]) }
          }).filter(function (p) {
            return isFinite(p.lat) && isFinite(p.lng)
          })
          if (!corners.length) return null

          const center = corners.reduce(function (acc, p) {
            acc.lat += p.lat
            acc.lng += p.lng
            return acc
          }, { lat: 0, lng: 0 })
          center.lat /= corners.length
          center.lng /= corners.length

          const wgs = swh.gcj02ToWgs84(center.lat, center.lng)
          return normalizePos(wgs.lat, wgs.lng, 50000)
        })
        .catch(function (err) {
          console.log('AMap IP location failed:', err)
          return null
        })
    }

    const getBrowserPosition = function (enableHighAccuracy, timeoutMs) {
      if (!navigator.geolocation) {
        return Promise.reject(new Error('navigator.geolocation unavailable'))
      }
      return new Promise(function (resolve, reject) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            })
          },
          function (err) {
            console.log('Browser geolocation error:', err && err.code, err && err.message)
            reject(err)
          },
          { enableHighAccuracy: enableHighAccuracy, timeout: timeoutMs, maximumAge: 120000 }
        )
      })
    }

    // Prefer device fix (with timeout). High accuracy first, then Wi‑Fi/cell‑assisted low accuracy.
    return getBrowserPosition(true, 22000)
      .catch(function () { return getBrowserPosition(false, 15000) })
      .catch(function () {
        return fetchAmapIpLocation().then(function (geoipPos) {
          if (geoipPos) {
            console.log('Using AMap IP fallback: ' + JSON.stringify(geoipPos))
            return geoipPos
          }
          throw new Error('Cannot detect position')
        })
      })
  },

  delay: function (t, v) {
    return new Promise(function (resolve) {
      setTimeout(resolve.bind(null, v), t)
    })
  },

  geoCodePosition: function (pos, ctx) {
    console.log('Geocoding position... ')
    const ll = ctx.$t('Lat {0}° Lon {1}°', [pos.lat.toFixed(3), pos.lng.toFixed(3)])
    var loc = {
      short_name: pos.accuracy > 500 ? ctx.$t('Near {0}', [ll]) : ll,
      country: 'Unknown',
      lng: pos.lng,
      lat: pos.lat,
      alt: pos.alt ? pos.alt : 0,
      accuracy: pos.accuracy,
      street_address: ''
    }
    const amapKey = this.getMainlandMapKey()
    if (!amapKey || !this.isInMainlandChina(pos.lat, pos.lng)) {
      return Promise.resolve(loc)
    }

    const gcj = this.wgs84ToGcj02(pos.lat, pos.lng)
    const url = 'https://restapi.amap.com/v3/geocode/regeo?key=' + encodeURIComponent(amapKey) +
      '&location=' + encodeURIComponent(gcj.lng + ',' + gcj.lat) +
      '&extensions=base&radius=1000&roadlevel=0'

    return fetch(url, { credentials: 'omit' }).then(response => {
      if (!response.ok) {
        console.log('AMap reverse geocoder failed due to: ' + response.statusText)
        return loc
      }
      return response.json().then(res => {
        if (res.status !== '1' || !res.regeocode) return loc

        const address = res.regeocode.addressComponent || {}
        const province = Array.isArray(address.province) ? address.province[0] : address.province
        const city = Array.isArray(address.city) ? address.city[0] : address.city
        const district = Array.isArray(address.district) ? address.district[0] : address.district
        const name = district || city || province || res.regeocode.formatted_address
        if (name) loc.short_name = pos.accuracy > 500 ? ctx.$t('Near {0}', [name]) : name
        loc.country = address.country || '中国'
        loc.street_address = res.regeocode.formatted_address || ''
        return loc
      })
    }).catch(err => {
      console.log('AMap reverse geocoder failed:', err)
      return loc
    })
  },

  searchLocations: function (query) {
    const amapKey = this.getMainlandMapKey()
    const q = (query || '').trim()
    if (!amapKey || !q) return Promise.resolve([])

    const url = 'https://restapi.amap.com/v3/geocode/geo?key=' + encodeURIComponent(amapKey) +
      '&address=' + encodeURIComponent(q)

    return fetch(url, { credentials: 'omit' }).then(response => {
      if (!response.ok) return []
      return response.json().then(res => {
        if (res.status !== '1' || !Array.isArray(res.geocodes)) return []

        return res.geocodes.map(function (item, index) {
          if (!item.location) return null
          const pair = item.location.split(',')
          const gcjLng = Number(pair[0])
          const gcjLat = Number(pair[1])
          if (!isFinite(gcjLat) || !isFinite(gcjLng)) return null

          const wgs = swh.gcj02ToWgs84(gcjLat, gcjLng)
          const province = Array.isArray(item.province) ? item.province[0] : item.province
          const city = Array.isArray(item.city) ? item.city[0] : item.city
          const district = Array.isArray(item.district) ? item.district[0] : item.district
          return {
            id: 'amap-' + index + '-' + item.location,
            short_name: item.formatted_address || district || city || province || q,
            country: item.country || '中国',
            lng: wgs.lng,
            lat: wgs.lat,
            alt: 0,
            accuracy: 100,
            street_address: item.formatted_address || ''
          }
        }).filter(function (item) { return item })
      })
    }).catch(err => {
      console.log('AMap geocoder failed:', err)
      return []
    })
  },

  getDistanceFromLatLonInM: function (lat1, lon1, lat2, lon2) {
    var deg2rad = function (deg) {
      return deg * (Math.PI / 180)
    }
    var R = 6371000 // Radius of the earth in m
    var dLat = deg2rad(lat2 - lat1)
    var dLon = deg2rad(lon2 - lon1)
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    var d = R * c // Distance in m
    return d
  },

  // Look for the next time starting from now on when the night Sky is visible
  // i.e. when sun is more than 10 degree below horizon.
  // If no such time was found (e.g. in a northern country in summer),
  // we default to current time.
  getTimeAfterSunset: function (stel) {
    const sun = stel.getObj('NAME Sun')
    const obs = stel.observer.clone()
    const utc = Math.floor(obs.utc * 24 * 60 / 5) / (24 * 60 / 5)
    let i
    for (i = 0; i < 24 * 60 / 5 + 1; i++) {
      obs.utc = utc + 1.0 / (24 * 60) * (i * 5)
      const sunRadec = sun.getInfo('RADEC', obs)
      const azalt = stel.convertFrame(obs, 'ICRF', 'OBSERVED', sunRadec)
      const alt = stel.anpm(stel.c2s(azalt)[1])
      if (alt < -13 * Math.PI / 180) {
        break
      }
    }
    if (i === 0 || i === 24 * 60 / 5 + 1) {
      return stel.observer.utc
    }
    return obs.utc
  },

  // Get the list of circumpolar stars in a given magnitude range
  //
  // Arguments:
  //   obs      - An observer.
  //   maxMag   - The maximum magnitude above which objects are discarded.
  //   filter   - a function called for each object returning false if the
  //              object must be filtered out.
  //
  // Return:
  //   An array SweObject. It is the responsibility of the caller to properly
  //   destroy all the objects of the list when they are not needed, by calling
  //   obj.destroy() on each of them.
  //
  // Example code:
  //   // Return all cicumpolar stars between mag -2 and 4
  //   let res = swh.getCircumpolarStars(this.$stel.observer, -2, 4)
  //   // Do something with the stars
  //   console.log(res.length)
  //   // Destroy the objects (don't forget this line!)
  //   res.map(e => e.destroy())
  getCircumpolarStars: function (obs, minMag, maxMag) {
    const $stel = Vue.prototype.$stel
    const filter = function (obj) {
      if (obj.getInfo('vmag', obs) <= minMag) {
        return false
      }
      const posJNOW = $stel.convertFrame(obs, 'ICRF', 'JNOW', obj.getInfo('radec'))
      const radecJNOW = $stel.c2s(posJNOW)
      const decJNOW = $stel.anpm(radecJNOW[1])
      if (obs.latitude >= 0) {
        return decJNOW >= Math.PI / 2 - obs.latitude
      } else {
        return decJNOW <= -Math.PI / 2 + obs.latitude
      }
    }
    return $stel.core.stars.listObjs(obs, maxMag, filter)
  },

  circumpolarMask: undefined,
  showCircumpolarMask: function (obs, show) {
    if (show === undefined) {
      show = true
    }
    const layer = Vue.prototype.$skyHintsLayer
    const $stel = Vue.prototype.$stel
    if (this.circumpolarMask) {
      layer.remove(this.circumpolarMask)
      this.circumpolarMask = undefined
    }
    if (show) {
      const diam = 2.0 * Math.PI - Math.abs(obs.latitude) * 2
      const shapeParams = {
        pos: [0, 0, obs.latitude > 0 ? -1 : 1, 0],
        frame: $stel.FRAME_JNOW,
        size: [diam, diam],
        color: [0.1, 0.1, 0.1, 0.8],
        border_color: [0.1, 0.1, 0.6, 1]
      }
      this.circumpolarMask = layer.add('circle', shapeParams)
    }
  }
}

export default swh
