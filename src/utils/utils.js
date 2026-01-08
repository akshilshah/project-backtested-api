import config from '../config/index'
import jwt from 'jsonwebtoken'

const bcrypt = require('bcrypt')

// hash password
export const hashText = async text => {
  try {
    const saltRounds = 10
    const hash = await bcrypt.hash(text, saltRounds)
    return hash
  } catch (error) {
    console.log(error)
  }
}

// compare hash
export const compareHash = async (text, hash) => {
  try {
    const match = await bcrypt.compare(text, hash)
    return match
  } catch (error) {
    console.log(error)
  }
}

export const generateJWTToken = async obj => {
  return (
    'Bearer ' +
    jwt.sign(obj, config.SECRETS.JWT, {
      expiresIn: config.SECRETS.JWTEXP
    })
  )
}

export const verifyJWTToken = token => {
  try {
    return jwt.verify(token, config.SECRETS.JWT)
  } catch (error) {
    console.log(error)
    return false
  }
}

export const UIMode = Object.freeze({
  BLUE: 'BLUE',
  BYD: 'BYD',
  SARJAH: 'SARJAH'
})

export const DEFAULT_UI_MODE = UIMode.BLUE

export function normalizeUiMode(raw) {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase()
  return Object.values(UIMode).includes(s) ? s : DEFAULT_UI_MODE
}

export function buildUiContext({ uiMode, blueId } = {}) {
  return { uiMode: normalizeUiMode(uiMode), blueId }
}

// -----------------------------------------
// Country enums + helpers
// -----------------------------------------
export const Country = Object.freeze({
  AE: 'AE', // UAE
  KSA: 'KSA'
})

const ALIASES = new Map([
  ['AE', 'AE'],
  ['UAE', 'AE'],
  ['ARE', 'AE'],
  ['KSA', 'KSA'],
  ['SA', 'KSA'],
  ['SAU', 'KSA']
])

const tryLocaleTail = s => {
  const m = s.match(/(?:^|[-_])([A-Z]{2})$/) // en-AE / ar-SA
  return m ? m[1] : null
}

export function normalizeCountry(raw) {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase()
  if (!s) return Country.AE

  if (ALIASES.has(s)) return ALIASES.get(s)

  const tail = tryLocaleTail(s)
  if (tail && ALIASES.has(tail)) return ALIASES.get(tail)

  return Country.AE
}

export const getCountryConfig = countryRaw => {
  const country = normalizeCountry(countryRaw)

  if (country === Country.KSA) {
    return {
      countryCode: 'KSA',
      countryName: 'Saudi Arabia',
      marketLabel: 'KSA',
      currency: { code: 'SAR', symbol: 'SAR' },
      regions: [
        { name: 'Riyadh', emoji: '🏛️' },
        { name: 'Jeddah', emoji: '🕌' },
        { name: 'Dammam', emoji: '🏖️' },
        { name: 'Mecca', emoji: '🕋' },
        { name: 'Medina', emoji: '🌟' }
      ],
      expert: 'KSA BYD EV expert',
      pricingText: 'KSA pricing/availability only',
      welcomeRegion: 'KSA'
    }
  }

  // Default AE
  return {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    marketLabel: 'UAE',
    currency: { code: 'AED', symbol: 'AED' },
    regions: [
      { name: 'Abu Dhabi', emoji: '🏛️' },
      { name: 'Dubai', emoji: '🏙️' },
      { name: 'Sharjah', emoji: '🕌' },
      { name: 'Ajman', emoji: '🏖️' },
      { name: 'Ras Al Khaimah', emoji: '🏞️' },
      { name: 'Fujairah', emoji: '🗻' },
      { name: 'Umm Al Quwain', emoji: '🌊' }
    ],
    expert: 'UAE BYD EV expert',
    pricingText: 'UAE pricing/availability only',
    welcomeRegion: 'UAE'
  }
}

export const AE_TERMS = [
  'AE',
  'UAE',
  'ARE',
  'UNITED ARAB EMIRATES',
  'DUBAI',
  'ABU DHABI',
  'SHARJAH',
  'AJMAN',
  'RAS AL KHAIMAH',
  'FUJAIRAH',
  'UMM AL QUWAIN',
  'uae',
  'dubai',
  'abu dhabi',
  'sharjah',
  'ajman',
  'ras al khaimah',
  'fujairah',
  'umm al quwain',
  'الإمارات',
  'دبي',
  'ابو ظبي',
  'أبوظبي',
  'الشارقة',
  'عجمان',
  'رأس الخيمة',
  'الفجيرة',
  'أم القيوين'
]

export const KSA_TERMS = [
  'KSA',
  'SA',
  'SAU',
  'SAUDI',
  'SAUDI ARABIA',
  'KINGDOM OF SAUDI ARABIA',
  'RIYADH',
  'JEDDAH',
  'DAMMAM',
  'MECCA',
  'MEDINA',
  'ksa',
  'saudi',
  'saudi arabia',
  'riyadh',
  'jeddah',
  'dammam',
  'mecca',
  'medina',
  'المملكة العربية السعودية',
  'السعودية',
  'الرياض',
  'جدة',
  'مكة',
  'المدينة'
]
