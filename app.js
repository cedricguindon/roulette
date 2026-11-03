import * as roulette from './roulette.js';
import * as storage from './storage.js';

const numberGrid = document.querySelector('#number-grid');
const historyList = document.querySelector('#history-list');
const statGroups = document.querySelector('#stat-groups');
const spinCount = document.querySelector('#spin-count');
const undoButton = document.querySelector('#undo-button');
const clearButton = document.querySelector('#clear-button');
const streakDisplays = {
  color: {
    current: document.querySelector('#color-streak'),
    label: document.querySelector('#color-streak-label'),
    probability: document.querySelector('#color-streak-probability'),
    result: document.querySelector('#color-streak-probability').closest('.streak-result'),
    alert: document.querySelector('#color-streak-alert'),
    outcomeLabel: 'Color',
  },
  parity: {
    current: document.querySelector('#parity-streak'),
    label: document.querySelector('#parity-streak-label'),
    probability: document.querySelector('#parity-streak-probability'),
    result: document.querySelector('#parity-streak-probability').closest('.streak-result'),
    alert: document.querySelector('#parity-streak-alert'),
    outcomeLabel: 'Parity',
  },
  range: {
    current: document.querySelector('#range-streak'),
    label: document.querySelector('#range-streak-label'),
    probability: document.querySelector('#range-streak-probability'),
    result: document.querySelector('#range-streak-probability').closest('.streak-result'),
    alert: document.querySelector('#range-streak-alert'),
    outcomeLabel: 'Range',
  },
  alternatingColor: {
    current: document.querySelector('#alternating-color-streak'),
    label: document.querySelector('#alternating-color-streak-label'),
    probability: document.querySelector('#alternating-color-streak-probability'),
    result: document.querySelector('#alternating-color-streak-probability').closest('.streak-result'),
    alert: document.querySelector('#alternating-color-streak-alert'),
    outcomeLabel: 'Alternating Color',
  },
  alternatingParity: {
    current: document.querySelector('#alternating-parity-streak'),
    label: document.querySelector('#alternating-parity-streak-label'),
    probability: document.querySelector('#alternating-parity-streak-probability'),
    result: document.querySelector('#alternating-parity-streak-probability').closest('.streak-result'),
    alert: document.querySelector('#alternating-parity-streak-alert'),
    outcomeLabel: 'Alternating Parity',
  },
  alternatingRange: {
    current: document.querySelector('#alternating-range-streak'),
    label: document.querySelector('#alternating-range-streak-label'),
    probability: document.querySelector('#alternating-range-streak-probability'),
    result: document.querySelector('#alternating-range-streak-probability').closest('.streak-result'),
    alert: document.querySelector('#alternating-range-streak-alert'),
    outcomeLabel: 'Alternating Range',
  },
};
const absentOutcomeDisplays = {
  dozen: {
    outcomes: document.querySelector('#dozen-outcomes'),
    alerts: document.querySelector('#dozen-bet-alerts'),
    label: 'dozen',
    names: ['', '1st dozen', '2nd dozen', '3rd dozen'],
    getOutcome: (number) => number === 0 ? null : Math.ceil(number / 12),
  },
  column: {
    outcomes: document.querySelector('#column-outcomes'),
    alerts: document.querySelector('#column-bet-alerts'),
    label: 'column',
    names: ['', '1st column', '2nd column', '3rd column'],
    getOutcome: (number) => number === 0 ? null : (number - 1) % 3 + 1,
  },
};
const streakThresholdInput = document.querySelector('#streak-threshold-input');
const streakThresholdValue = document.querySelector('#streak-threshold-value');
const absentOutcomeThresholdInput = document.querySelector('#absent-outcome-threshold-input');
const absentOutcomeThresholdValue = document.querySelector('#absent-outcome-threshold-value');
const currentCashInput = document.querySelector('#current-cash-input');
const totalWageredValue = document.querySelector('#total-wagered-value');
const gainsValue = document.querySelector('#gains-value');
const lossesValue = document.querySelector('#losses-value');
const statusMessage = document.querySelector('#status-message');

let history = loadHistory();
let streakThreshold = loadStreakThreshold(storage.STORAGE_KEYS.streakThreshold, 'streak');
let absentOutcomeThreshold = loadStreakThreshold(storage.STORAGE_KEYS.absentOutcomeThreshold, 'dozen/column');
let ledger = loadLedger();
let pendingBets = [];

function getColor(number) {
  return roulette.getColor(number);
}

function loadHistory() {
  return storage.loadHistory(showStatus);
}

function loadStreakThreshold(storageKey, thresholdType) {
  return storage.loadStreakThreshold(storageKey, thresholdType, showStatus);
}

function saveStreakThreshold(storageKey, threshold, thresholdType) {
  storage.saveStreakThreshold(storageKey, threshold, thresholdType, showStatus);
}

function loadLedger() {
  return storage.loadLedger(history, showStatus);
}

function saveLedger() {
  storage.saveLedger(ledger, showStatus);
}

function saveHistory() {
  storage.saveHistory(history, showStatus);
}

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('is-visible', Boolean(message));
}

function createNumberButtons() {
  for (let column = 0; column < 12; column += 1) {
    for (let row = 0; row < 3; row += 1) {
      const number = column * 3 + (3 - row);
      const color = getColor(number);
      const dozen = Math.ceil(number / 12);
      const rouletteColumn = (number - 1) % 3 + 1;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `number-button ${color}`;
      button.dataset.number = String(number);
      button.dataset.dozen = String(dozen);
      button.textContent = String(number);
      button.style.gridColumn = String(column + 1);
      button.style.gridRow = String(row + 1);
      button.setAttribute(
        'aria-label',
        `Add ${number}, ${color}, ${['', '1st', '2nd', '3rd'][dozen]} dozen, ${['', '1st', '2nd', '3rd'][rouletteColumn]} column`,
      );
      numberGrid.append(button);
    }
  }
}

function addNumber(number) {
  if (!Number.isInteger(number) || number < 0 || number > 36) {
    showStatus('Enter a whole number from 0 to 36.');
    return;
  }

  const settlement = settlePendingBets(number);
  history.push(number);
  ledger.settlements.push(settlement);
  saveHistory();
  saveLedger();
  render();
}

function renderStats() {
  const total = history.length;
  const stats = [
    { title: 'Color', options: [
      { label: 'Red', count: history.filter((number) => getColor(number) === 'red').length, style: 'red-fill' },
      { label: 'Black', count: history.filter((number) => getColor(number) === 'black').length, style: 'black-fill' },
      { label: 'Green', count: history.filter((number) => number === 0).length, style: 'green-fill' },
    ] },
    { title: 'Parity', options: [
      { label: 'Odd', count: history.filter((number) => number % 2 === 1).length },
      { label: 'Even', count: history.filter((number) => number !== 0 && number % 2 === 0).length },
    ] },
    { title: 'Range', options: [
      { label: 'Low · 1–18', count: history.filter((number) => number >= 1 && number <= 18).length },
      { label: 'High · 19–36', count: history.filter((number) => number >= 19 && number <= 36).length },
    ] },
  ];

  statGroups.replaceChildren(...stats.map((group) => {
    const section = document.createElement('section');
    section.className = 'stat-group';

    const heading = document.createElement('div');
    heading.className = 'stat-group-heading';
    heading.textContent = group.title;
    const denominator = document.createElement('span');
    denominator.textContent = `${total} SPIN${total === 1 ? '' : 'S'}`;
    heading.append(denominator);
    section.append(heading);

    for (const option of group.options) {
      const row = document.createElement('div');
      row.className = 'stat-row';

      const labels = document.createElement('div');
      labels.className = 'stat-row-labels';
      const label = document.createElement('span');
      label.textContent = option.label;
      const value = document.createElement('span');
      value.className = 'stat-value';
      const percentage = total === 0 ? 0 : Math.round((option.count / total) * 100);
      value.textContent = `${option.count} · ${percentage}%`;
      labels.append(label, value);

      const track = document.createElement('div');
      track.className = 'stat-track';
      track.setAttribute('aria-label', `${option.label}: ${option.count} of ${total} spins`);
      const fill = document.createElement('div');
      fill.className = `stat-fill ${option.style ?? ''}`.trim();
      fill.style.width = `${percentage}%`;
      track.append(fill);
      row.append(labels, track);
      section.append(row);
    }
    return section;
  }));
}

function renderHistory() {
  const recentNumbers = history.slice(-roulette.HISTORY_LIMIT).reverse();
  historyList.replaceChildren();

  if (recentNumbers.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Your spins will appear here. Add a number to get started.';
    historyList.append(emptyState);
    return;
  }

  for (const [index, number] of recentNumbers.entries()) {
    const chip = document.createElement('span');
    chip.className = `history-chip ${getColor(number)}`;
    chip.textContent = String(number);
    chip.title = `Spin ${history.length - index}`;
    historyList.append(chip);
  }
}

function formatStreakProbability(probability) {
  return roulette.formatStreakProbability(probability);
}

function getStreak(history, getOutcome) {
  return roulette.getStreak(history, getOutcome);
}

function getAlternatingStreak(numbers, getOutcome) {
  return roulette.getAlternatingStreak(numbers, getOutcome);
}

function getOutcomeAfterSpin(number, getOutcome) {
  return roulette.getOutcomeAfterSpin(number, getOutcome, history);
}

function getProgressionStep(streakLength, getOutcomeProbability, progressionLength, threshold) {
  return roulette.getProgressionStep(streakLength, getOutcomeProbability, progressionLength, threshold);
}

function getStartingBet() {
  return roulette.getStartingBet(ledger.cashCents);
}

function getFibonacciBets() {
  return roulette.getFibonacciBets(ledger.cashCents);
}

function renderStreakGroup(
  display,
  streak,
  getOutcomeProbability,
  describeStreak,
  getBetOutcome,
  emptyMessage,
  threshold,
  isBetWon,
  getExtendedStreakOutcome = (outcome) => outcome,
) {
  if (!streak) {
    display.current.textContent = emptyMessage;
    display.label.textContent = 'Chance of the extended streak';
    display.probability.textContent = '—';
    display.result.classList.remove('below-threshold');
    display.alert.hidden = true;
    display.alert.textContent = '';
    return;
  }

  const extendedLength = streak.length + 1;
  const probability = getOutcomeProbability(streak.outcome) ** extendedLength;
  const isBelowThreshold = probability * 100 < threshold;
  display.current.textContent = `Current streak: ${describeStreak(streak.outcome, streak.length)}.`;
  display.label.textContent = `Chance of ${describeStreak(getExtendedStreakOutcome(streak.outcome), extendedLength)}`;
  display.probability.textContent = formatStreakProbability(probability);
  display.result.classList.toggle('below-threshold', isBelowThreshold);
  display.alert.hidden = !isBelowThreshold;
  if (isBelowThreshold) {
    const progressionStep = getProgressionStep(
      streak.length,
      () => getOutcomeProbability(streak.outcome),
      roulette.BET_MULTIPLIERS.length,
      threshold,
    );
    const multiplier = roulette.BET_MULTIPLIERS[progressionStep];
    const betAmountCents = Math.round(getStartingBet() * multiplier) * 100;
    queuePendingBet({
      alert: display.alert,
      amountCents: betAmountCents,
      incrementCents: 100,
      wins: (number) => isBetWon(streak.outcome)(number),
      payoutMultiplier: 1,
      description: (amountCents, scaled) => `Below ${threshold}% threshold (${formatStreakProbability(probability)}). Bet ${formatCurrency(amountCents / 100)} on ${getBetOutcome(streak.outcome)}${scaled ? ' (scaled to current cash)' : ''} (step ${progressionStep + 1} of ${roulette.BET_MULTIPLIERS.length}).`,
    });
  } else {
    display.alert.textContent = '';
  }
}

function queuePendingBet(bet) {
  pendingBets.push(bet);
}

function getSettledBetAmounts() {
  const totalRequestedCents = pendingBets.reduce((total, bet) => total + bet.amountCents, 0);
  const availableCents = ledger.cashCents;
  const scale = totalRequestedCents > availableCents && totalRequestedCents > 0
    ? availableCents / totalRequestedCents
    : 1;

  return pendingBets.map((bet) => {
    const scaledAmount = Math.floor((bet.amountCents * scale) / bet.incrementCents) * bet.incrementCents;
    const amountCents = Math.min(bet.amountCents, scaledAmount);
    const scaled = amountCents < bet.amountCents;
    bet.alert.textContent = amountCents === 0
      ? 'Bet skipped: current cash is below the minimum wager.'
      : bet.description(amountCents, scaled);
    return { ...bet, amountCents };
  }).filter((bet) => bet.amountCents > 0);
}

function settlePendingBets(number) {
  const bets = getSettledBetAmounts();
  const settlement = { wageredCents: 0, gainsCents: 0, lossesCents: 0 };

  for (const bet of bets) {
    settlement.wageredCents += bet.amountCents;
    if (bet.wins(number)) {
      settlement.gainsCents += bet.amountCents * bet.payoutMultiplier;
    } else {
      settlement.lossesCents += bet.amountCents;
    }
  }

  ledger.cashCents += settlement.gainsCents - settlement.lossesCents;
  ledger.totalWageredCents += settlement.wageredCents;
  ledger.gainsCents += settlement.gainsCents;
  ledger.lossesCents += settlement.lossesCents;
  return settlement;
}

function getMissedSpins(targetOutcome, getOutcome) {
  let missedSpins = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (getOutcome(history[index]) === targetOutcome) break;
    missedSpins += 1;
  }
  return missedSpins;
}

function getNoActiveStreakMessage(outcomeType, startMessage) {
  if (history.length === 0) return startMessage;
  if (history[history.length - 1] !== 0) return startMessage;
  return `Latest result is 0; a ${outcomeType} streak starts after the next nonzero result.`;
}

function renderAbsentOutcomeGroup(display) {
  const alertNodes = [];
  display.outcomes.replaceChildren();

  if (history.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'streak-current';
    emptyState.textContent = 'Add a spin to start tracking outcomes that have not appeared.';
    display.outcomes.append(emptyState);
    display.alerts.replaceChildren();
    return;
  }

  for (let outcome = 1; outcome <= 3; outcome += 1) {
    const missedSpins = getMissedSpins(outcome, display.getOutcome);
    const nextMissProbability = (25 / 37) ** (missedSpins + 1);
    const isBelowThreshold = missedSpins > 0 && nextMissProbability * 100 < absentOutcomeThreshold;
    const row = document.createElement('div');
    row.className = 'outcome-tracking-row';

    const title = document.createElement('span');
    title.className = 'outcome-tracking-name';
    title.textContent = display.names[outcome];

    const detail = document.createElement('span');
    detail.className = 'outcome-tracking-detail';
    detail.textContent = missedSpins === 0
      ? 'Hit on the latest spin'
      : `No hit for ${missedSpins} spin${missedSpins === 1 ? '' : 's'} · ${formatStreakProbability(nextMissProbability)} chance of another miss`;
    row.append(title, detail);
    display.outcomes.append(row);

    if (!isBelowThreshold) continue;

    const alert = document.createElement('p');
    alert.className = 'threshold-alert';
    alert.setAttribute('role', 'status');
    alert.setAttribute('aria-live', 'polite');
    const bets = getFibonacciBets();
    if (bets.length === 0) {
      alert.textContent = `Below ${absentOutcomeThreshold}% threshold (${formatStreakProbability(nextMissProbability)}). The 25% cash budget is below the $0.10 minimum bet for the Fibonacci ladder.`;
    } else {
      const progressionStep = getProgressionStep(missedSpins, () => 25 / 37, bets.length, absentOutcomeThreshold);
      const betAmountCents = bets[progressionStep];
      queuePendingBet({
        alert,
        amountCents: betAmountCents,
        incrementCents: 1,
        wins: (number) => display.getOutcome(number) === outcome,
        payoutMultiplier: 2,
        description: (amountCents, scaled) => `Below ${absentOutcomeThreshold}% threshold (${formatStreakProbability(nextMissProbability)}). Bet ${formatCurrency(amountCents / 100, true)} on ${display.names[outcome]}${scaled ? ' (scaled to current cash)' : ''} (step ${progressionStep + 1} of ${bets.length}).`,
      });
    }
    alertNodes.push(alert);
  }

  display.alerts.replaceChildren(...alertNodes);
}

function formatCurrency(amount, includeCents = false) {
  return roulette.formatCurrency(amount, includeCents);
}

function renderStreakProbability() {
  pendingBets = [];
  const colorOutcome = (number) => number === 0 ? null : getColor(number);
  const parityOutcome = (number) => number === 0 ? null : number % 2 === 0 ? 'even' : 'odd';
  const rangeOutcome = (number) => number === 0 ? null : number <= 18 ? 'low' : 'high';
  renderStreakGroup(
      streakDisplays.color,
      getStreak(history, colorOutcome),
      () => 18 / 37,
      (color, length) => {
        const colorLabel = color[0].toUpperCase() + color.slice(1);
        return `${length} ${colorLabel}${length === 1 ? '' : 's'} in a row`;
      },
      (color) => color === 'red' ? 'Black' : 'Red',
      getNoActiveStreakMessage('color', 'Add a spin to start tracking a color streak.'),
      streakThreshold,
      (color) => (number) => getOutcomeAfterSpin(number, colorOutcome) === (color === 'red' ? 'black' : 'red'),
      (color) => color === 'red' ? 'black' : 'red',
  );
  renderStreakGroup(
      streakDisplays.parity,
      getStreak(history, parityOutcome),
      () => 18 / 37,
      (parity, length) => `${length} ${parity === 'odd' ? 'Odd' : 'Even'} result${length === 1 ? '' : 's'} in a row`,
      (parity) => parity === 'odd' ? 'Even' : 'Odd',
      getNoActiveStreakMessage('parity', 'Add a spin to start tracking an odd/even streak.'),
      streakThreshold,
      (parity) => (number) => getOutcomeAfterSpin(number, parityOutcome) === (parity === 'odd' ? 'even' : 'odd'),
      (parity) => parity === 'odd' ? 'even' : 'odd',
  );
  renderStreakGroup(
      streakDisplays.range,
      getStreak(history, rangeOutcome),
      () => 18 / 37,
      (range, length) => `${length} ${range === 'low' ? 'Low' : 'High'} result${length === 1 ? '' : 's'} in a row`,
      (range) => range === 'low' ? 'High' : 'Low',
      getNoActiveStreakMessage('range', 'Add a spin to start tracking a low/high streak.'),
      streakThreshold,
      (range) => (number) => getOutcomeAfterSpin(number, rangeOutcome) === (range === 'low' ? 'high' : 'low'),
      (range) => range === 'low' ? 'high' : 'low',
  );
  renderStreakGroup(
      streakDisplays.alternatingColor,
      getAlternatingStreak(history, colorOutcome),
      () => 18 / 37,
      (color, length) => `${length} alternating Red/Black results ending in ${color === 'red' ? 'Red' : 'Black'}`,
      (color) => color === 'red' ? 'Red' : 'Black',
      'Add at least two spins to start tracking alternating colors.',
      streakThreshold,
      (color) => (number) => getOutcomeAfterSpin(number, colorOutcome) === color,
  );
  renderStreakGroup(
      streakDisplays.alternatingParity,
      getAlternatingStreak(history, parityOutcome),
      () => 18 / 37,
      (parity, length) => `${length} alternating Odd/Even results ending in ${parity === 'odd' ? 'Odd' : 'Even'}`,
      (parity) => parity === 'odd' ? 'Odd' : 'Even',
      'Add at least two spins to start tracking alternating parity.',
      streakThreshold,
      (parity) => (number) => getOutcomeAfterSpin(number, parityOutcome) === parity,
  );
  renderStreakGroup(
      streakDisplays.alternatingRange,
      getAlternatingStreak(history, rangeOutcome),
      () => 18 / 37,
      (range, length) => `${length} alternating Low/High results ending in ${range === 'low' ? 'Low' : 'High'}`,
      (range) => range === 'low' ? 'Low' : 'High',
      'Add at least two spins to start tracking alternating range.',
      streakThreshold,
      (range) => (number) => getOutcomeAfterSpin(number, rangeOutcome) === range,
  );
  renderAbsentOutcomeGroup(absentOutcomeDisplays.dozen);
  renderAbsentOutcomeGroup(absentOutcomeDisplays.column);
  getSettledBetAmounts();

  streakThresholdInput.value = String(streakThreshold);
  streakThresholdValue.value = `${streakThreshold}%`;
  streakThresholdValue.textContent = `${streakThreshold}%`;
  absentOutcomeThresholdInput.value = String(absentOutcomeThreshold);
  absentOutcomeThresholdValue.value = `${absentOutcomeThreshold}%`;
  absentOutcomeThresholdValue.textContent = `${absentOutcomeThreshold}%`;
  currentCashInput.value = String((ledger.cashCents / 100).toFixed(2));
  totalWageredValue.textContent = formatCurrency(ledger.totalWageredCents / 100, true);
  gainsValue.textContent = formatCurrency(ledger.gainsCents / 100, true);
  lossesValue.textContent = formatCurrency(ledger.lossesCents / 100, true);
}

function render() {
  spinCount.textContent = String(history.length);
  undoButton.disabled = history.length === 0;
  clearButton.disabled = history.length === 0;
  renderStats();
  renderHistory();
  renderStreakProbability();
}

streakThresholdInput.addEventListener('input', () => {
  streakThreshold = Number(streakThresholdInput.value);
  saveStreakThreshold(storage.STORAGE_KEYS.streakThreshold, streakThreshold, 'streak');
  renderStreakProbability();
});

absentOutcomeThresholdInput.addEventListener('input', () => {
  absentOutcomeThreshold = Number(absentOutcomeThresholdInput.value);
  saveStreakThreshold(storage.STORAGE_KEYS.absentOutcomeThreshold, absentOutcomeThreshold, 'dozen/column');
  renderStreakProbability();
});

currentCashInput.addEventListener('change', () => {
  if (!currentCashInput.reportValidity()) {
    showStatus('Current cash must be between $0 and $100,000.');
    return;
  }

  ledger.cashCents = Math.round(Number(currentCashInput.value) * 100);
  saveLedger();
  render();
});

document.querySelector('#roulette-board').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-number]');
  if (button) addNumber(Number(button.dataset.number));
});

undoButton.addEventListener('click', () => {
  if (history.length === 0) return;
  history.pop();
  const settlement = ledger.settlements.pop();
  if (settlement) {
    ledger.cashCents -= settlement.gainsCents - settlement.lossesCents;
    ledger.totalWageredCents -= settlement.wageredCents;
    ledger.gainsCents -= settlement.gainsCents;
    ledger.lossesCents -= settlement.lossesCents;
  }
  saveHistory();
  saveLedger();
  render();
});

clearButton.addEventListener('click', () => {
  if (history.length === 0 || !window.confirm('Clear spin history and gain/loss totals? Current cash will stay unchanged.')) return;
  history = [];
  ledger.totalWageredCents = 0;
  ledger.gainsCents = 0;
  ledger.lossesCents = 0;
  ledger.settlements = [];
  saveHistory();
  saveLedger();
  render();
});

createNumberButtons();
render();
