import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateBaseAmount, calculatePricing, parseExpression } from './calculator.js'

test('parses and prices the basic 2 + 3 example', () => {
  const totalInches = parseExpression('2 + 3')

  assert.equal(totalInches, 180n)
  assert.equal(calculateBaseAmount(totalInches), 20000n)
})

test('treats digits after the decimal point as inches', () => {
  assert.equal(parseExpression('1.33 + 1.4'), 109n)
  assert.equal(calculateBaseAmount(parseExpression('1.33 + 1.4')), 12150n)
})

test('carries inches into yards when displaying the total measurement', () => {
  const totalInches = parseExpression('4 + 5.23 + 3.24')

  assert.equal(totalInches, 479n)
  assert.equal(totalInches / 36n, 13n)
  assert.equal(totalInches % 36n, 11n)
  assert.equal(calculateBaseAmount(totalInches), 53250n)
})

test('carries 36 inches within a single measurement into the next yard', () => {
  assert.equal(parseExpression('5.36'), 216n)
  assert.equal(parseExpression('0.36'), 36n)
})

test('rounds amounts up to the next 50 ks', () => {
  assert.equal(calculateBaseAmount(1n), 150n)
  assert.equal(calculateBaseAmount(36n), 4000n)
})

test('does not apply the discount below 10 total yards', () => {
  const pricing = calculatePricing(359n)

  assert.equal(pricing.totalAmount, 39900n)
  assert.equal('freeAmount' in pricing, false)
  assert.equal('off' in pricing, false)
})

test('applies the discount at exactly 10 total yards', () => {
  assert.deepEqual(calculatePricing(360n), {
    totalAmount: 40000n,
    freeAmount: 39000n,
    off: 1000n,
  })
})

test('calculates the HLD decimal example with exact rounding', () => {
  const totalInches = parseExpression('4 + 5.23 + 3.24')

  assert.deepEqual(calculatePricing(totalInches), {
    totalAmount: 53250n,
    freeAmount: 51900n,
    off: 1350n,
  })
})

test('checks discount eligibility using the entire expression total', () => {
  const totalInches = parseExpression('6 + 4')

  assert.deepEqual(calculatePricing(totalInches), {
    totalAmount: 40000n,
    freeAmount: 39000n,
    off: 1000n,
  })
})

test('rejects empty or incomplete expressions and zero totals', () => {
  for (const expression of ['', '2 +', '+ 2', '2..3', '2 / 3', '0']) {
    assert.throws(() => parseExpression(expression), Error, expression)
  }
})
