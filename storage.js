const STORAGE_KEY = 'roulette-tracker-history';
const THRESHOLD_STORAGE_KEY = 'roulette-tracker-streak-threshold';
const ABSENT_OUTCOME_THRESHOLD_STORAGE_KEY = 'roulette-tracker-absent-outcome-threshold';
const STARTING_CASH_STORAGE_KEY = 'roulette-tracker-starting-cash';
const LEDGER_STORAGE_KEY = 'roulette-tracker-ledger';
const DEFAULT_STREAK_THRESHOLD = 2;
const DEFAULT_STARTING_CASH = 160;

export function loadHistory(showStatus) {
  try {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory === null) return [];

    const parsedHistory = JSON.parse(savedHistory);
    if (!Array.isArray(parsedHistory) || !parsedHistory.every(
      (number) => Number.isInteger(number) && number >= 0 && number <= 36,
    )) {
      throw new Error('Saved roulette history is invalid.');
    }

    return parsedHistory;
  } catch (error) {
    showStatus(`Could not load saved history: ${error.message}`);
    return [];
  }
}

export function loadStreakThreshold(storageKey, thresholdType, showStatus) {
  try {
    const savedThreshold = localStorage.getItem(storageKey);
    if (savedThreshold === null) return DEFAULT_STREAK_THRESHOLD;

    const parsedThreshold = Number(savedThreshold);
    if (!Number.isFinite(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > 50) {
      throw new Error(`Saved ${thresholdType} threshold must be between 0% and 50%.`);
    }

    return parsedThreshold;
  } catch (error) {
    showStatus(`Could not load saved ${thresholdType} threshold: ${error.message}`);
    return DEFAULT_STREAK_THRESHOLD;
  }
}

export function saveStreakThreshold(storageKey, threshold, thresholdType, showStatus) {
  try {
    localStorage.setItem(storageKey, String(threshold));
    showStatus('');
  } catch (error) {
    showStatus(`Could not save ${thresholdType} threshold on this device: ${error.message}`);
  }
}

function loadStartingCash(showStatus) {
  try {
    const savedCash = localStorage.getItem(STARTING_CASH_STORAGE_KEY);
    if (savedCash === null) return DEFAULT_STARTING_CASH;

    const parsedCash = Number(savedCash);
    if (!Number.isFinite(parsedCash) || parsedCash < 0 || parsedCash > 100000) {
      throw new Error('Saved current cash must be between $0 and $100,000.');
    }

    return parsedCash;
  } catch (error) {
    showStatus(`Could not load saved current cash: ${error.message}`);
    return DEFAULT_STARTING_CASH;
  }
}

function createEmptyLedger(history, cashCents) {
  return {
    cashCents,
    totalWageredCents: 0,
    gainsCents: 0,
    lossesCents: 0,
    settlements: history.map(() => ({ wageredCents: 0, gainsCents: 0, lossesCents: 0 })),
  };
}

export function loadLedger(history, showStatus) {
  try {
    const savedLedger = localStorage.getItem(LEDGER_STORAGE_KEY);
    if (savedLedger === null) {
      return createEmptyLedger(history, Math.round(loadStartingCash(showStatus) * 100));
    }

    const parsedLedger = JSON.parse(savedLedger);
    const isValidAmount = (amount) => Number.isSafeInteger(amount) && amount >= 0;
    if (
      !parsedLedger
      || !isValidAmount(parsedLedger.cashCents)
      || !isValidAmount(parsedLedger.totalWageredCents)
      || !isValidAmount(parsedLedger.gainsCents)
      || !isValidAmount(parsedLedger.lossesCents)
      || !Array.isArray(parsedLedger.settlements)
      || parsedLedger.settlements.some((settlement) => (
        !settlement
        || !isValidAmount(settlement.wageredCents)
        || !isValidAmount(settlement.gainsCents)
        || !isValidAmount(settlement.lossesCents)
      ))
    ) {
      throw new Error('Saved cash ledger is invalid.');
    }

    while (parsedLedger.settlements.length < history.length) {
      parsedLedger.settlements.unshift({ wageredCents: 0, gainsCents: 0, lossesCents: 0 });
    }
    parsedLedger.settlements.length = history.length;
    return parsedLedger;
  } catch (error) {
    showStatus(`Could not load saved cash ledger: ${error.message}`);
    return createEmptyLedger(history, DEFAULT_STARTING_CASH * 100);
  }
}

export function saveLedger(ledger, showStatus) {
  try {
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(ledger));
    localStorage.setItem(STARTING_CASH_STORAGE_KEY, String(ledger.cashCents / 100));
    showStatus('');
  } catch (error) {
    showStatus(`Could not save cash ledger on this device: ${error.message}`);
  }
}

export function saveHistory(history, showStatus) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    showStatus('');
  } catch (error) {
    showStatus(`Could not save history on this device: ${error.message}`);
  }
}

export const STORAGE_KEYS = {
  history: STORAGE_KEY,
  streakThreshold: THRESHOLD_STORAGE_KEY,
  absentOutcomeThreshold: ABSENT_OUTCOME_THRESHOLD_STORAGE_KEY,
};
