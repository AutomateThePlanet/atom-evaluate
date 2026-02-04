const KEY = "maturityTracker_v1";

export function loadState() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(KEY);
}

export function downloadJson(state, filename = "maturityTracker-export.json") {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJsonFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}
