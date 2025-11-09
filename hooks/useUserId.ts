/**
 * Simple user identification hook
 * Retrieves user ID from URL query parameter (?user=dad)
 * Falls back to 'guest' if not specified
 */
export function useUserId(): string {
  if (typeof window === 'undefined') return 'guest';

  const params = new URLSearchParams(window.location.search);
  return params.get('user') || 'guest';
}

/**
 * Get user ID without hook (for use outside React components)
 */
export function getUserId(): string {
  if (typeof window === 'undefined') return 'guest';

  const params = new URLSearchParams(window.location.search);
  return params.get('user') || 'guest';
}
