// Small per-device preferences. localStorage can throw (private mode,
// blocked storage), so every access is guarded.

const LAST_EVENT = 'tem.lastEvent'

export function getLastEvent(): string {
  try {
    return localStorage.getItem(LAST_EVENT) ?? ''
  } catch {
    return ''
  }
}

export function setLastEvent(id: string) {
  try {
    localStorage.setItem(LAST_EVENT, id)
  } catch {
    /* ignore */
  }
}
