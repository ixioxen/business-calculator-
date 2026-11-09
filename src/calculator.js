export const BASE_RATE = 4000n
export const DISCOUNT_RATE = 3900n
export const DISCOUNT_THRESHOLD_YARDS = 10n
const INCHES_PER_YARD = 36n
const ROUNDING_STEP = 50n

function tokenizeExpression(expression) {
  const normalized = expression.trim()

  if (!normalized || !/^\d+(?:\.\d+)?(?:\s*\+\s*\d+(?:\.\d+)?)*$/.test(normalized)) {
    throw new Error('Enter one or more measurements, such as 2 + 3.12.')
  }

  return normalized.split('+').map((term) => term.trim())
}

export function countExpressionPieces(expression) {
  return tokenizeExpression(expression).length
}

export function parseExpression(expression) {
  const terms = tokenizeExpression(expression)
  const totalInches = terms.reduce((total, term) => {
    const [yards, inches = '0'] = term.trim().split('.')
    return total + BigInt(yards) * INCHES_PER_YARD + BigInt(inches)
  }, 0n)

  if (totalInches === 0n) {
    throw new Error('The total measurement must be greater than zero.')
  }

  return totalInches
}

export function calculateBaseAmount(totalInches, baseRate = BASE_RATE) {
  return roundAmountUp(totalInches, baseRate)
}

export function calculatePricing(
  totalInches,
  baseRate = BASE_RATE,
  discountRate = DISCOUNT_RATE,
  discountThresholdYards = DISCOUNT_THRESHOLD_YARDS,
) {
  validateTotalInches(totalInches)
  validateRate(baseRate, 'Base rate')
  validateRate(discountRate, 'Discount rate')

  if (discountRate >= baseRate) {
    throw new Error('Discount rate must be less than the base rate.')
  }

  if (typeof discountThresholdYards !== 'bigint' || discountThresholdYards <= 0n) {
    throw new Error('Discount threshold must be a positive whole number of yards.')
  }

  const pricing = { totalAmount: roundAmountUp(totalInches, baseRate) }

  if (totalInches > discountThresholdYards * INCHES_PER_YARD) {
    pricing.freeAmount = roundAmountUp(totalInches, discountRate)
    pricing.off = roundAmountUp(totalInches, baseRate - discountRate)
  }

  return pricing
}

function roundAmountUp(totalInches, rate) {
  validateTotalInches(totalInches)
  validateRate(rate, 'Rate')

  const exactAmountNumerator = totalInches * rate
  const amountStepDenominator = INCHES_PER_YARD * ROUNDING_STEP
  const roundedSteps = (exactAmountNumerator + amountStepDenominator - 1n) / amountStepDenominator

  return roundedSteps * ROUNDING_STEP
}

function validateTotalInches(totalInches) {
  if (typeof totalInches !== 'bigint' || totalInches <= 0n) {
    throw new Error('Total inches must be a positive whole number.')
  }
}

function validateRate(rate, name) {
  if (typeof rate !== 'bigint' || rate <= 0n) {
    throw new Error(`${name} must be a positive whole number.`)
  }
}
