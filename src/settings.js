import { BASE_RATE, DISCOUNT_RATE, DISCOUNT_THRESHOLD_YARDS } from './calculator.js'

export const SETTINGS_STORAGE_KEY = 'business-yard-calculator-settings'
export const DEFAULT_SETTINGS = Object.freeze({
  baseRate: BASE_RATE,
  discountRate: DISCOUNT_RATE,
  discountThresholdYards: DISCOUNT_THRESHOLD_YARDS,
  language: 'en',
})

export function parseSettingsForm(form) {
  const settings = {
    baseRate: parsePositiveInteger(form.baseRate, 'Base rate'),
    discountRate: parsePositiveInteger(form.discountRate, 'Discount rate'),
    discountThresholdYards: parsePositiveInteger(form.discountThresholdYards, 'Discount threshold'),
    language: form.language,
  }

  validateSettings(settings)
  return settings
}

export function loadSettings(storage) {
  const saved = storage.getItem(SETTINGS_STORAGE_KEY)
  if (saved === null) return { ...DEFAULT_SETTINGS }

  let parsed
  try {
    parsed = JSON.parse(saved)
  } catch {
    throw new Error('Saved settings are invalid.')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Saved settings are invalid.')
  }

  const settings = {
    baseRate: parsePositiveInteger(parsed.baseRate, 'Base rate'),
    discountRate: parsePositiveInteger(parsed.discountRate, 'Discount rate'),
    discountThresholdYards: parsePositiveInteger(parsed.discountThresholdYards, 'Discount threshold'),
    language: parsed.language,
  }
  validateSettings(settings)
  return settings
}

export function saveSettings(settings, storage) {
  validateSettings(settings)
  storage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({
      baseRate: settings.baseRate.toString(),
      discountRate: settings.discountRate.toString(),
      discountThresholdYards: settings.discountThresholdYards.toString(),
      language: settings.language,
    }),
  )
}

function parsePositiveInteger(value, label) {
  const text = String(value).trim()
  if (!/^\d+$/.test(text)) {
    throw new Error(`${label} must be a positive whole number.`)
  }

  const integer = BigInt(text)
  if (integer <= 0n) {
    throw new Error(`${label} must be a positive whole number.`)
  }
  return integer
}

function validateSettings(settings) {
  if (
    typeof settings.baseRate !== 'bigint' ||
    typeof settings.discountRate !== 'bigint' ||
    typeof settings.discountThresholdYards !== 'bigint' ||
    settings.baseRate <= 0n ||
    settings.discountRate <= 0n ||
    settings.discountThresholdYards <= 0n
  ) {
    throw new Error('Rates and threshold must be positive whole numbers.')
  }

  if (settings.discountRate >= settings.baseRate) {
    throw new Error('Discount rate must be less than the base rate.')
  }

  if (!['en', 'my'].includes(settings.language)) {
    throw new Error('Select a supported language.')
  }
}
