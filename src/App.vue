<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { calculatePricing, countExpressionPieces, parseExpression } from './calculator.js'
import { translations } from './i18n.js'
import { DEFAULT_SETTINGS, loadSettings, parseSettingsForm, saveSettings } from './settings.js'

const expression = ref('')
const result = ref(null)
const error = ref('')
const settings = ref({ ...DEFAULT_SETTINGS })
const settingsForm = ref(null)
const settingsOpen = ref(false)
const settingsMessage = ref('')
const settingsMessageType = ref('')
const t = computed(() => translations[settings.value.language])

try {
  settings.value = loadSettings(window.localStorage)
} catch {
  settingsMessage.value = 'settingsLoadError'
  settingsMessageType.value = 'warning'
}

watch(
  () => settings.value.language,
  (language) => {
    document.documentElement.lang = language
  },
  { immediate: true },
)

const keys = [
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '+', value: '+', kind: 'operator' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '⌫', value: 'backspace', kind: 'utility' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '.', value: '.', kind: 'operator' },
  { label: 'C', value: 'clear', kind: 'utility' },
  { label: '0', value: '0' },
]

function updateInput(value) {
  result.value = null
  error.value = ''

  if (value === 'clear') {
    expression.value = ''
    return
  }

  if (value === 'backspace') {
    expression.value = expression.value.trimEnd().slice(0, -1).trimEnd()
    return
  }

  const current = expression.value
  const currentTerm = current.split('+').at(-1).trim()

  if (value === '+') {
    if (/\d$/.test(current)) expression.value += ' + '
    return
  }

  if (value === '.') {
    if (!currentTerm.includes('.')) {
      expression.value += currentTerm ? '.' : '0.'
    }
    return
  }

  expression.value += value
}

function handleKeyboardInput(event) {
  if (
    settingsOpen.value ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLSelectElement ||
    event.target instanceof HTMLTextAreaElement
  ) {
    return
  }

  if (/^\d$/.test(event.key) || event.key === '+' || event.key === '.') {
    event.preventDefault()
    updateInput(event.key)
  } else if (event.key === 'Backspace') {
    event.preventDefault()
    updateInput('backspace')
  } else if (event.key === 'Enter') {
    if (event.target instanceof HTMLButtonElement) return
    event.preventDefault()
    calculate()
  } else if (event.key === 'Escape' && expression.value) {
    event.preventDefault()
    updateInput('clear')
  }
}

function calculate() {
  error.value = ''
  result.value = null

  try {
    const totalInches = parseExpression(expression.value)
    result.value = {
      totalInches,
      pieceCount: countExpressionPieces(expression.value),
      ...calculatePricing(
        totalInches,
        settings.value.baseRate,
        settings.value.discountRate,
        settings.value.discountThresholdYards,
      ),
    }
  } catch {
    error.value = 'invalidExpression'
  }
}

function openSettings() {
  settingsMessage.value = ''
  settingsMessageType.value = ''
  settingsForm.value = {
    baseRate: settings.value.baseRate.toString(),
    discountRate: settings.value.discountRate.toString(),
    discountThresholdYards: settings.value.discountThresholdYards.toString(),
    language: settings.value.language,
  }
  settingsOpen.value = true
}

function closeSettings() {
  settingsOpen.value = false
  settingsForm.value = null
}

function applySettings() {
  settingsMessage.value = ''
  settingsMessageType.value = ''

  let nextSettings
  try {
    nextSettings = parseSettingsForm(settingsForm.value)
  } catch {
    settingsMessage.value = 'invalidSettings'
    settingsMessageType.value = 'error'
    return
  }

  try {
    saveSettings(nextSettings, window.localStorage)
  } catch {
    settingsMessage.value = 'settingsSaveError'
    settingsMessageType.value = 'error'
    return
  }

  settings.value = nextSettings
  settingsMessage.value = 'settingsSaved'
  settingsMessageType.value = 'success'
  closeSettings()
}

function formatNumber(value) {
  return value.toLocaleString(settings.value.language === 'my' ? 'my-MM' : 'en-US')
}

onMounted(() => window.addEventListener('keydown', handleKeyboardInput))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeyboardInput))
</script>

<template>
  <main class="calculator-page">
    <header class="page-header">
      <div class="brand-mark" :aria-label="t.appName">
        <span class="brand-icon" aria-hidden="true">Y</span>
        <span>Yard<span class="brand-light">wise</span></span>
      </div>
      <button
        class="settings-toggle"
        type="button"
        :aria-expanded="settingsOpen"
        @click="settingsOpen ? closeSettings() : openSettings()"
      >
        <span aria-hidden="true">⚙</span>
        {{ t.settings }}
      </button>
    </header>

    <section class="calculator" aria-labelledby="page-title">
      <p
        v-if="settingsMessage && !settingsOpen"
        class="settings-message"
        :class="`message-${settingsMessageType}`"
        role="status"
      >
        {{ t[settingsMessage] }}
      </p>

      <section v-if="settingsOpen" class="settings-panel" :aria-label="t.settingsTitle">
        <div class="settings-panel-heading">
          <div>
            <p class="settings-kicker">{{ t.settings }}</p>
            <h1>{{ t.settingsTitle }}</h1>
          </div>
          <button class="close-settings" type="button" :aria-label="t.cancel" @click="closeSettings">
            ×
          </button>
        </div>

        <form class="settings-form" @submit.prevent="applySettings">
          <label>
            <span>{{ t.baseRate }}</span>
            <input
              v-model="settingsForm.baseRate"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              required
            />
          </label>
          <label>
            <span>{{ t.discountRate }}</span>
            <input
              v-model="settingsForm.discountRate"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              required
            />
          </label>
          <label>
            <span>{{ t.threshold }}</span>
            <input
              v-model="settingsForm.discountThresholdYards"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              required
            />
          </label>
          <label>
            <span>{{ t.language }}</span>
            <select v-model="settingsForm.language">
              <option value="en">{{ t.english }}</option>
              <option value="my">{{ t.burmese }}</option>
            </select>
          </label>
          <p
            v-if="settingsMessage"
            class="settings-message"
            :class="`message-${settingsMessageType}`"
            role="alert"
          >
            {{ t[settingsMessage] }}
          </p>
          <div class="settings-actions">
            <button class="cancel-button" type="button" @click="closeSettings">{{ t.cancel }}</button>
            <button class="save-settings-button" type="submit">{{ t.saveSettings }}</button>
          </div>
        </form>
      </section>

      <section v-else class="calculator-card" aria-label="Yard calculator">
        <div class="display-panel" aria-live="polite">
          <div class="display-heading">
            <span>{{ t.measurements }} </span>
            <span class="measurement-hint">{{ t.yardsInches }}</span>
          </div>
          <div class="expression" :class="{ 'is-empty': !expression }">
            {{ expression || '0' }}
          </div>
          <div class="display-caption">
            <template v-if="result">{{ t.calculated }}</template>
            <template v-else>{{ t.usePlus }}</template>
          </div>
        </div>

        <div class="keypad" :aria-label="t.keypad">
          <button
            v-for="key in keys"
            :key="key.value"
            class="key"
            :class="[`key-${key.kind || 'number'}`, { 'key-wide': key.value === '0' }]"
            type="button"
            :aria-label="
              key.value === 'clear' ? t.clear : key.value === 'backspace' ? t.backspace : key.label
            "
            @click="updateInput(key.value)"
          >
            {{ key.label }}
          </button>
        </div>

        <button class="calculate-button" type="button" @click="calculate">
          <span>{{ t.calculate }}</span>
          <span class="rate-label">
            {{ formatNumber(settings.baseRate) }} ks{{ t.perYard }} <span aria-hidden="true">→</span>
          </span>
        </button>

        <p v-if="error" class="error-message" role="alert">{{ t[error] }}</p>

        <section v-if="result" class="result-card" aria-live="polite" aria-label="Calculation result">
          <div class="result-heading">
            <span class="result-icon" aria-hidden="true">✓</span>
            <span>{{ t.yourTotal }}</span>
          </div>
          <div class="result-row">
            <span>{{ t.numberOfPieces }}</span>
            <strong>{{ formatNumber(result.pieceCount) }}</strong>
          </div>
          <div class="result-row">
            <span>{{ t.totalYards }}</span>
            <strong>
              {{ formatNumber(result.totalInches / 36n) }} {{ t.yardUnit }}
              <span v-if="result.totalInches % 36n">
                {{ formatNumber(result.totalInches % 36n) }} {{ t.inchUnit }}
              </span>
            </strong>
          </div>
          <div class="amount-row">
            <span>{{ t.totalAmount }}</span>
            <strong>{{ formatNumber(result.totalAmount) }} <small>ks</small></strong>
          </div>
          <template v-if="result.freeAmount !== undefined">
            <div class="savings-row">
              <span>{{ t.off }}</span>
              <span class="savings-value">
                − <strong>{{ formatNumber(result.off) }} <small>ks</small></strong>
              </span>
            </div>
            <div class="discount-row">
              <span>
                {{ t.freeAmount }}
                <small>
                  {{ t.discountAt }} {{ formatNumber(settings.discountRate) }} ks{{ t.perYard }}
                </small>
              </span>
              <strong>{{ formatNumber(result.freeAmount) }} <small>ks</small></strong>
            </div>
          </template>
        </section>
      </section>

      <p v-if="!settingsOpen" class="format-note">
        <span class="info-icon" aria-hidden="true">i</span>
        {{ t.formatHint }} <strong>2.12</strong>
      </p>
    </section>

    <footer class="page-footer">
      <span>{{ t.madeFor }}</span>
      <span>{{ t.yardEquals }}</span>
    </footer>
  </main>
</template>
