export const CREATOR_SELECTION_KEY = 'mira-creator-selections-v1';
export function readSelections(storage = localStorage) {
  try {
    const data = JSON.parse(storage.getItem(CREATOR_SELECTION_KEY));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch { return {}; }
}
// Candidate details always come from the checked-in catalog, not stored HTML/URLs.
export function selectedCandidates(catalog, selections, existing = []) {
  const seen = new Set(existing.map(c => c.url));
  return catalog.filter(c => selections[c.id]?.status === 'selected').flatMap(c => {
    if (seen.has(c.url)) return [];
    seen.add(c.url);
    return [{ ...c, instruction: String(selections[c.id].instruction || ''), selectionUpdatedAt: selections[c.id].updatedAt || '', reviewed: false }];
  });
}

export function mergeCandidates(catalog, selections, existing) {
  const selectedByUrl = new Map(catalog.filter(c => selections[c.id]?.status === 'selected').map(c => [c.url, selections[c.id]]));
  return [...existing.map(c => {
    const selection = selectedByUrl.get(c.url);
    return selection ? {...c, instruction: String(selection.instruction || ''), selectionUpdatedAt: selection.updatedAt || ''} : c;
  }), ...selectedCandidates(catalog, selections, existing)];
}
export function candidateInstruction(candidate, record) {
  return candidate.selectionUpdatedAt && (!record.updatedAt || candidate.selectionUpdatedAt > record.updatedAt)
    ? candidate.instruction : (record.instruction ?? candidate.instruction ?? '');
}
