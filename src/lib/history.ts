export interface HistoryEntry {
  id: string;
  jargon: string;
  explanation: string;
  timestamp: number;
}

const STORAGE_KEY = "jargon-buster-history";

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(jargon: string, explanation: string): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    jargon,
    explanation,
    timestamp: Date.now(),
  };
  const history = getHistory();
  history.unshift(entry);
  // Keep last 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  return entry;
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
