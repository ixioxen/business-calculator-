import assert from 'node:assert/strict'
import test from 'node:test'
import { calculatePricing, parseExpression } from './calculator.js'
import {
  DEFAULT_SETTINGS,
  loadSettings,
  parseSettingsForm,
  saveSettings,
  SETTINGS_STORAGE_KEY,
} from './settings.js'

function createStorage(initialValue = null) {
  const values = new Map()
  if (initialValue !== null) values.set(SETTINGS_STORAGE_KEY, initialValue)

  return {
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, value)
    },
  }
}

test('uses the documented defaults when no settings are saved', () => {
  assert.deepEqual(loadSettings(createStorage()), DEFAULT_SETTINGS)
})

test('saves and restores rates, threshold, and language', () => {
  const storage = createStorage()
  const settings = parseSettingsForm({
    baseRate: '5000',
    discountRate: '4500',
    discountThresholdYards: '8',
    language: 'my',
  })

  saveSettings(settings, storage)

  assert.deepEqual(loadSettings(storage), settings)
})

test('uses configured rates and threshold in pricing', () => {
  const settings = parseSettingsForm({
    baseRate: '5000',
    discountRate: '4500',
    discountThresholdYards: '8',
    language: 'en',
  })
  const totalInches = parseExpression('8.1')

  assert.deepEqual(
    calculatePricing(
      totalInches,
      settings.baseRate,
      settings.discountRate,
      settings.discountThresholdYards,
    ),
    {
      totalAmount: 40150n,
      freeAmount: 36150n,
      off: 4050n,
    },
  )
})

test('rejects invalid numbers, unsupported languages, and a discount above the base rate', () => {
  const invalidForms = [
    { baseRate: '0', discountRate: '3900', discountThresholdYards: '10', language: 'en' },
    { baseRate: '4000.5', discountRate: '3900', discountThresholdYards: '10', language: 'en' },
    { baseRate: '4000', discountRate: '4000', discountThresholdYards: '10', language: 'en' },
    { baseRate: '4000', discountRate: '3900', discountThresholdYards: '10', language: 'fr' },
  ]

  for (const form of invalidForms) {
    assert.throws(() => parseSettingsForm(form))
  }
})

test('reports malformed saved settings instead of silently accepting them', () => {
  const storage = createStorage('{not json')
  assert.throws(() => loadSettings(storage), /Saved settings are invalid/)
})
