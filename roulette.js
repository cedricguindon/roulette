export const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const HISTORY_LIMIT = 25;
export const BET_MULTIPLIERS = [1, 3, 9, 27];

export function getColor(number) {
  if (number === 0) return 'green';
  return RED_NUMBERS.has(number) ? 'red' : 'black';
}

export function formatStreakProbability(probability) {
  const percentage = probability * 100;
  if (percentage >= 0.01) return `${percentage.toFixed(2)}%`;
  return `${percentage.toPrecision(3)}%`;
}

export function formatCurrency(amount, includeCents = false) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: includeCents ? 2 : 0,
    maximumFractionDigits: includeCents ? 2 : 0,
  }).format(amount);
}

export function getStreak(history, getOutcome) {
  const outcomes = getEffectiveOutcomes(history, getOutcome);
  if (outcomes.length === 0) return null;

  const outcome = outcomes[outcomes.length - 1];
  if (outcome === null) return null;

  let length = 0;
  for (let index = outcomes.length - 1; index >= 0 && outcomes[index] === outcome; index -= 1) {
    length += 1;
  }
  return { outcome, length };
}

export function getEffectiveOutcomes(numbers, getOutcome) {
  let previousOutcome = null;
  return numbers.map((number) => {
    const outcome = getOutcome(number);
    if (outcome !== null) previousOutcome = outcome;
    return outcome ?? previousOutcome;
  });
}

export function getAlternatingStreak(numbers, getOutcome) {
  const outcomes = getEffectiveOutcomes(numbers, getOutcome);
  if (outcomes.length < 2) return null;

  let length = 1;
  for (let index = outcomes.length - 1; index > 0; index -= 1) {
    if (
      outcomes[index] === null
      || outcomes[index - 1] === null
      || outcomes[index] === outcomes[index - 1]
    ) break;
    length += 1;
  }

  return length < 2 ? null : { outcome: outcomes[outcomes.length - 1], length };
}

export function getOutcomeAfterSpin(number, getOutcome, history) {
  const outcome = getOutcome(number);
  if (outcome !== null) return outcome;

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const previousOutcome = getOutcome(history[index]);
    if (previousOutcome !== null) return previousOutcome;
  }
  return null;
}

export function getProgressionStep(streakLength, getOutcomeProbability, progressionLength, threshold) {
  let firstAlertLength = 1;
  while (getOutcomeProbability() ** (firstAlertLength + 1) * 100 >= threshold) {
    firstAlertLength += 1;
  }
  return (streakLength - firstAlertLength) % progressionLength;
}

export function getStartingBet(cashCents) {
  const fourStepBudget = cashCents / 400;
  return Math.max(1, Math.round(fourStepBudget / 40));
}

export function getFibonacciBets(cashCents) {
  const budgetInCents = Math.floor(cashCents / 4);
  const bets = [];
  let previous = 10;
  let current = 10;
  let total = 0;

  while (total + previous <= budgetInCents) {
    bets.push(previous);
    total += previous;
    [previous, current] = [current, previous + current];
  }

  return bets;
}
