const PRIVACY_MODAL_KEY = 'mhh_privacy_modal_last_shown';
const HOURS_BETWEEN_SHOWS = 24;

export function shouldShowPrivacyModal(): boolean {
  if (typeof window === 'undefined') return false;

  const lastShown = localStorage.getItem(PRIVACY_MODAL_KEY);
  
  if (!lastShown) {
    // Never shown before
    return true;
  }

  const lastShownDate = new Date(lastShown);
  const now = new Date();
  const hoursSinceLastShow = (now.getTime() - lastShownDate.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastShow >= HOURS_BETWEEN_SHOWS;
}

export function markPrivacyModalShown(): void {
  if (typeof window === 'undefined') return;
  
  const now = new Date().toISOString();
  localStorage.setItem(PRIVACY_MODAL_KEY, now);
}

export function getLastPrivacyModalShown(): Date | null {
  if (typeof window === 'undefined') return null;
  
  const lastShown = localStorage.getItem(PRIVACY_MODAL_KEY);
  return lastShown ? new Date(lastShown) : null;
}