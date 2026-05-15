// Common sky-object display names used by the app UI and the engine bridge.
// Keep this frontend-only so we can localize familiar names without changing
// upstream skydata or rebuilding the WebAssembly engine.

import {
  DSO_ENGLISH_ZH,
  MESSIER_NUM_TO_ZH,
  PLANET_NAME_ZH
} from './sky-corpus-zh'

const APP_LOCALE_STORAGE_KEY = 'app_locale'

const CONSTELLATION_ZH = Object.freeze({
  Andromeda: '仙女座',
  'Chained Maiden': '仙女座',
  Antlia: '唧筒座',
  Apus: '天燕座',
  Aquarius: '宝瓶座',
  'Water Bearer': '宝瓶座',
  Aquila: '天鹰座',
  Eagle: '天鹰座',
  Ara: '天坛座',
  Altar: '天坛座',
  Aries: '白羊座',
  Ram: '白羊座',
  Auriga: '御夫座',
  Charioteer: '御夫座',
  Bootes: '牧夫座',
  Boötes: '牧夫座',
  Herdsman: '牧夫座',
  Caelum: '雕具座',
  Chisel: '雕具座',
  Camelopardalis: '鹿豹座',
  Giraffe: '鹿豹座',
  Cancer: '巨蟹座',
  Crab: '巨蟹座',
  'Canes Venatici': '猎犬座',
  'Hunting Dogs': '猎犬座',
  'Canis Major': '大犬座',
  'Great Dog': '大犬座',
  'Canis Minor': '小犬座',
  'Little Dog': '小犬座',
  Capricornus: '摩羯座',
  'Sea Goat': '摩羯座',
  Carina: '船底座',
  Keel: '船底座',
  Cassiopeia: '仙后座',
  Centaurus: '半人马座',
  Centaur: '半人马座',
  Cepheus: '仙王座',
  Cetus: '鲸鱼座',
  Whale: '鲸鱼座',
  Chamaeleon: '蝘蜓座',
  Circinus: '圆规座',
  Columba: '天鸽座',
  Dove: '天鸽座',
  'Coma Berenices': '后发座',
  "Berenice's Hair": '后发座',
  'Corona Australis': '南冕座',
  'Southern Crown': '南冕座',
  'Corona Borealis': '北冕座',
  'Northern Crown': '北冕座',
  Corvus: '乌鸦座',
  Crow: '乌鸦座',
  Crater: '巨爵座',
  Cup: '巨爵座',
  Crux: '南十字座',
  'Southern Cross': '南十字座',
  Cygnus: '天鹅座',
  Swan: '天鹅座',
  Delphinus: '海豚座',
  Dolphin: '海豚座',
  Dorado: '剑鱼座',
  Draco: '天龙座',
  Dragon: '天龙座',
  Equuleus: '小马座',
  Eridanus: '波江座',
  River: '波江座',
  Fornax: '天炉座',
  Furnace: '天炉座',
  Gemini: '双子座',
  Twins: '双子座',
  Grus: '天鹤座',
  Crane: '天鹤座',
  Hercules: '武仙座',
  Horologium: '时钟座',
  Hydra: '长蛇座',
  'Sea Serpent': '长蛇座',
  Hydrus: '水蛇座',
  Indus: '印第安座',
  Lacerta: '蝎虎座',
  Lizard: '蝎虎座',
  Leo: '狮子座',
  Lion: '狮子座',
  'Leo Minor': '小狮座',
  'Lesser Lion': '小狮座',
  Lepus: '天兔座',
  Hare: '天兔座',
  Libra: '天秤座',
  Scales: '天秤座',
  Lupus: '豺狼座',
  Wolf: '豺狼座',
  Lynx: '天猫座',
  Lyra: '天琴座',
  Lyre: '天琴座',
  Mensa: '山案座',
  Microscopium: '显微镜座',
  Monoceros: '麒麟座',
  Unicorn: '麒麟座',
  Musca: '苍蝇座',
  Fly: '苍蝇座',
  Norma: '矩尺座',
  Octans: '南极座',
  Ophiuchus: '蛇夫座',
  'Serpent Bearer': '蛇夫座',
  Orion: '猎户座',
  Hunter: '猎户座',
  Pavo: '孔雀座',
  Peacock: '孔雀座',
  Pegasus: '飞马座',
  Perseus: '英仙座',
  Phoenix: '凤凰座',
  Pictor: '绘架座',
  Pisces: '双鱼座',
  Fishes: '双鱼座',
  'Piscis Austrinus': '南鱼座',
  'Southern Fish': '南鱼座',
  Puppis: '船尾座',
  Pyxis: '罗盘座',
  Reticulum: '网罟座',
  Sagitta: '天箭座',
  Arrow: '天箭座',
  Sagittarius: '人马座',
  Archer: '人马座',
  Scorpius: '天蝎座',
  Scorpion: '天蝎座',
  Sculptor: '玉夫座',
  Scutum: '盾牌座',
  Shield: '盾牌座',
  Serpens: '巨蛇座',
  Serpent: '巨蛇座',
  Sextans: '六分仪座',
  Taurus: '金牛座',
  Bull: '金牛座',
  Telescopium: '望远镜座',
  Triangulum: '三角座',
  Triangle: '三角座',
  'Triangulum Australe': '南三角座',
  Tucana: '杜鹃座',
  Ursa: '熊座',
  'Ursa Major': '大熊座',
  'Great Bear': '大熊座',
  'Ursa Minor': '小熊座',
  'Little Bear': '小熊座',
  Vela: '船帆座',
  Sails: '船帆座',
  Virgo: '室女座',
  Maiden: '室女座',
  Volans: '飞鱼座',
  Vulpecula: '狐狸座',
  Fox: '狐狸座',
  'Argo Navis': '南船座',
  Argonavis: '南船座'
})

const STAR_ZH = Object.freeze({
  Sirius: '天狼星',
  Canopus: '老人星',
  Arcturus: '大角星',
  Vega: '织女星',
  Capella: '五车二',
  Rigel: '参宿七',
  Procyon: '南河三',
  Betelgeuse: '参宿四',
  Achernar: '水委一',
  'Alpha Centauri': '南门二',
  'Rigil Kentaurus': '南门二',
  Toliman: '南门二',
  Hadar: '马腹一',
  Agena: '马腹一',
  Altair: '牛郎星',
  Acrux: '十字架二',
  Aldebaran: '毕宿五',
  Antares: '心宿二',
  Spica: '角宿一',
  Pollux: '北河三',
  Fomalhaut: '北落师门',
  Deneb: '天津四',
  Regulus: '轩辕十四',
  Adhara: '弧矢七',
  Shaula: '尾宿八',
  Castor: '北河二',
  Gacrux: '十字架一',
  Bellatrix: '参宿五',
  Elnath: '五车五',
  Alnilam: '参宿二',
  Alnitak: '参宿一',
  Mintaka: '参宿三',
  Saiph: '参宿六',
  Dubhe: '天枢',
  Merak: '天璇',
  Phecda: '天玑',
  Megrez: '天权',
  Alioth: '玉衡',
  Mizar: '开阳',
  Alkaid: '摇光',
  Polaris: '北极星',
  Kochab: '帝星',
  Mirfak: '天船三',
  Algol: '大陵五',
  Mirach: '奎宿九',
  Hamal: '娄宿三',
  Denebola: '五帝座一',
  Zosma: '西上相',
  Algieba: '轩辕十二',
  'Epsilon Leonis': '狮子座 ε',
  Alphecca: '贯索四',
  Alhena: '井宿三',
  Alphard: '星宿一',
  Markab: '室宿一',
  Scheat: '室宿二',
  Algenib: '壁宿一',
  Enif: '危宿三',
  Schedar: '王良四',
  Caph: '王良一',
  Ruchbah: '阁道三',
  Navi: '策',
  Mirzam: '军市一',
  Wezen: '弧矢一',
  Sargas: '尾宿五',
  'Kaus Australis': '箕宿三',
  Nunki: '斗宿四',
  Diphda: '土司空',
  Menkar: '天囷一',
  Menkalinan: '五车三',
  Miaplacidus: '南船五',
  Avior: '海石一',
  Atria: '三角形三',
  Alnair: '鹤一',
  Rasalhague: '候',
  Zubenelgenubi: '氐宿一',
  Zubeneschamali: '氐宿四',
  Algorab: '轸宿三',
  Vindemiatrix: '右执法',
  Izar: '梗河一',
  Albireo: '辇道增七',
  Alderamin: '天钩五',
  Aljanah: '天津九',
  Almach: '天大将军一',
  'Alpha Pavonis': '孔雀十一',
  Aludra: '弧矢九',
  Ankaa: '火鸟六',
  Arneb: '厕一',
  Aspidiske: '海石二',
  Dschubba: '房宿四',
  Eltanin: '天棓四',
  Gienah: '轸宿四',
  Larawag: '尾宿二',
  Menkent: '柱十一',
  Mimosa: '十字架三',
  Naos: '弧矢增二十二',
  Regor: '天社一',
  Sabik: '天市右垣十一',
  Sirrah: '壁宿二',
  Suhail: '海山二',
  Tiaki: '鹤二',
  Rasalmuthallah: '天大将军一'
})

// Extra engine/API query strings for proper names that do not resolve via
// getObj(english) or getObj('NAME ' + english) (designation mismatch in core_search).
const STAR_SEARCH_QUERIES_BY_ENGLISH = Object.freeze({
  Mizar: ['HIP 65378']
})

const SKY_NAME_ZH = Object.freeze({
  ...CONSTELLATION_ZH,
  ...STAR_ZH,
  ...PLANET_NAME_ZH
})

const SKY_NAME_ZH_BY_NORMALIZED_KEY = Object.freeze(
  Object.keys(SKY_NAME_ZH).reduce(function (acc, key) {
    acc[normalizeSearchKey(key)] = SKY_NAME_ZH[key]
    return acc
  }, {})
)

const CHINESE_TO_SKY_NAME = Object.freeze(
  Object.keys(SKY_NAME_ZH).reduce(function (acc, key) {
    const value = normalizeSearchKey(SKY_NAME_ZH[key])
    if (!acc[value]) acc[value] = []
    acc[value].push(key)
    return acc
  }, {})
)

const CHINESE_SEARCH_ENTRIES = Object.freeze(
  Object.keys({
    ...SKY_NAME_ZH,
    ...DSO_ENGLISH_ZH
  }).reduce(function (acc, key) {
    const zh = SKY_NAME_ZH[key] || DSO_ENGLISH_ZH[key]
    acc.push({
      query: key,
      zh: zh,
      key: normalizeSearchKey(zh)
    })
    return acc
  }, []).concat(
    Object.keys(MESSIER_NUM_TO_ZH).map(function (n) {
      return {
        query: 'M ' + n,
        zh: MESSIER_NUM_TO_ZH[n],
        key: normalizeSearchKey(MESSIER_NUM_TO_ZH[n])
      }
    })
  )
)

function uniquePush (arr, value) {
  if (arr.indexOf(value) === -1) {
    arr.push(value)
  }
}

function getChineseSearchMatches (key, limit) {
  const exact = []
  const prefix = []
  const contains = []
  for (let i = 0; i < CHINESE_SEARCH_ENTRIES.length; i++) {
    const entry = CHINESE_SEARCH_ENTRIES[i]
    if (!entry.key) continue
    if (entry.key === key) {
      uniquePush(exact, entry.query)
    } else if (entry.key.startsWith(key)) {
      uniquePush(prefix, entry.query)
    } else if (entry.key.indexOf(key) !== -1) {
      uniquePush(contains, entry.query)
    }
  }
  return exact.concat(prefix, contains).slice(0, limit || 10)
}

function getStoredLocale () {
  if (typeof window !== 'undefined' && window.__SW_APP_LOCALE) {
    return window.__SW_APP_LOCALE
  }
  try {
    return localStorage.getItem(APP_LOCALE_STORAGE_KEY) || 'en'
  } catch (e) {
    return 'en'
  }
}

function isChineseLocale (locale) {
  return String(locale || getStoredLocale()).toLowerCase().startsWith('zh')
}

function normalizeNameKey (name) {
  return String(name || '')
    .replace(/<[^>]+>/g, '')
    .replace(/^NAME\s+/i, '')
    .replace(/^CON\s+western\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeSearchKey (name) {
  return normalizeNameKey(name).replace(/\s+/g, '').toLowerCase()
}

const DSO_ENGLISH_ZH_BY_NORM = Object.freeze(
  Object.keys(DSO_ENGLISH_ZH).reduce(function (acc, k) {
    acc[normalizeSearchKey(k)] = DSO_ENGLISH_ZH[k]
    return acc
  }, {})
)

function translateMessierLabel (key) {
  const m = /^M\s*(\d{1,3})(?:\b|[\s(]|$)/i.exec(key.trim())
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (n < 1 || n > 110) return null
  const zh = MESSIER_NUM_TO_ZH[n]
  if (!zh) return null
  return 'M' + n + '（' + zh + '）'
}

function translateCaldwellLabel (key) {
  const m = /^C\s*(\d{1,3})(?:\b|[\s(]|$)/i.exec(key.trim())
  if (!m) return null
  return '卡德威尔' + parseInt(m[1], 10)
}

function translateDsoEnglish (key) {
  const k = key.trim()
  if (DSO_ENGLISH_ZH[k]) return DSO_ENGLISH_ZH[k]
  return DSO_ENGLISH_ZH_BY_NORM[normalizeSearchKey(k)] || null
}

export function translateSkyName (name, locale) {
  if (!isChineseLocale(locale) || !name) {
    return name
  }

  const key = normalizeNameKey(name)
  const nk = normalizeSearchKey(key)
  return (
    SKY_NAME_ZH[key] ||
    SKY_NAME_ZH_BY_NORMALIZED_KEY[nk] ||
    translateMessierLabel(key) ||
    translateCaldwellLabel(key) ||
    translateDsoEnglish(key) ||
    name
  )
}

export function getSkySearchQuery (query) {
  const key = normalizeSearchKey(query)
  const exact = CHINESE_TO_SKY_NAME[key]
  return exact && exact.length ? exact[0] : query
}

export function getSkySearchQueries (query, limit) {
  const key = normalizeSearchKey(query)
  if (!key) return []
  const exact = CHINESE_TO_SKY_NAME[key] || []
  const matches = getChineseSearchMatches(key, limit)
  const res = []
  exact.concat(matches).forEach(function (item) {
    uniquePush(res, item)
    const extras = STAR_SEARCH_QUERIES_BY_ENGLISH[item]
    if (extras) {
      for (let j = 0; j < extras.length; j++) {
        uniquePush(res, extras[j])
      }
    }
  })
  if (res.length) return res.slice(0, limit || 10)
  return [query]
}
