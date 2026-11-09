<script setup>
import { ref } from 'vue'
import { calculatePricing, parseExpression } from './calculator.js'

const expression = ref('')
const result = ref(null)
const error = ref('')

const keys = [
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '+', value: '+', kind: 'operator' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '⌫', value: 'backspace', kind: 'utility', description: 'Delete last character' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '.', value: '.', kind: 'operator', description: 'Inches separator' },
  { label: 'C', value: 'clear', kind: 'utility', description: 'Clear calculator' },
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

function calculate() {
  error.value = ''
  result.value = null

  try {
    const totalInches = parseExpression(expression.value)
    result.value = {
      totalInches,
      ...calculatePricing(totalInches),
    }
  } catch (cause) {
    error.value = cause.message
  }
}

function formatNumber(value) {
  return value.toLocaleString('en-US')
}
</script>

<template>
  <main class="calculator-page">
    <header class="page-header">
      <div class="brand-mark" aria-label="Business Yard Calculator">
        <span class="brand-icon" aria-hidden="true">Y</span>
        <span>Yard<span class="brand-light">wise</span></span>
      </div>
      <span class="version-label">FABRIC CALCULATOR</span>
    </header>

    <section class="calculator" aria-labelledby="page-title">
      <!-- <div class="intro">
        <p class="eyebrow">SIMPLE, ACCURATE PRICING</p>
        <h1 id="page-title">Business Yard<br />Calculator</h1>
        <p class="intro-copy">Add your fabric lengths and get the total in seconds.</p>
      </div> -->

      <section class="calculator-card" aria-label="Yard calculator">
        <div class="display-panel" aria-live="polite">
          <div class="display-heading">
            <span>YOUR MEASUREMENTS</span>
            <span class="measurement-hint">yards.inches</span>
          </div>
          <div class="expression" :class="{ 'is-empty': !expression }">
            {{ expression || '0' }}
          </div>
          <div class="display-caption">
            <template v-if="result">Calculation complete</template>
            <template v-else>Use + to add multiple lengths</template>
          </div>
        </div>

        <div class="keypad" aria-label="Calculator keypad">
          <button
            v-for="key in keys"
            :key="key.value"
            class="key"
            :class="[`key-${key.kind || 'number'}`, { 'key-wide': key.value === '0' }]"
            type="button"
            :aria-label="key.description || key.label"
            @click="updateInput(key.value)"
          >
            {{ key.label }}
          </button>
        </div>

        <button class="calculate-button" type="button" @click="calculate">
          <span>Calculate amount</span>
          <span class="rate-label">4,000 ks / yard <span aria-hidden="true">→</span></span>
        </button>

        <p v-if="error" class="error-message" role="alert">{{ error }}</p>

        <section v-if="result" class="result-card" aria-live="polite" aria-label="Calculation result">
          <div class="result-heading">
            <span class="result-icon" aria-hidden="true">✓</span>
            <span>YOUR TOTAL</span>
          </div>
          <div class="result-row">
            <span>Total yards</span>
            <strong>
              {{ formatNumber(result.totalInches / 36n) }} yd
              <span v-if="result.totalInches % 36n">
                {{ formatNumber(result.totalInches % 36n) }} in
              </span>
            </strong>
          </div>
          <div class="amount-row">
            <span>Total amount</span>
            <strong>{{ formatNumber(result.totalAmount) }} <small>ks</small></strong>
          </div>
          <template v-if="result.freeAmount !== undefined">
            <div class="discount-row">
              <span>Total free amount <small>at 3,900 ks / yard</small></span>
              <strong>{{ formatNumber(result.freeAmount) }} <small>ks</small></strong>
            </div>
            <div class="savings-row">
              <span>Off</span>
              <strong>{{ formatNumber(result.off) }} <small>ks</small></strong>
            </div>
          </template>
        </section>
      </section>

      <p class="format-note">
        <span class="info-icon" aria-hidden="true">i</span>
        Enter inches after the dot. For example, <strong>2.12</strong> means 2 yards and 12 inches.
      </p>
    </section>

    <footer class="page-footer">
      <span>Made for every measure.</span>
      <span>36 inches = 1 yard</span>
    </footer>
  </main>
</template>
