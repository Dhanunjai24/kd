/**
 * Haptic Feedback Engine for KaamDost
 * -----------------------------------
 * Provides standard navigator.vibrate() vibration patterns for tactile feedback
 * on mobile devices and supported browsers during key worker interactions.
 */

export const HAPTIC_PATTERNS = {
  // Unique distinct long-pulse pattern specifically for 'Top Recommended' (100% match) job requests
  // Heavy, sustained pulses [400ms on, 100ms pause, 400ms on, 100ms pause, 600ms grand pulse]
  TOP_RECOMMENDED_JOB: [400, 100, 400, 100, 600],
  TOP_RECOMMENDED_100_MATCH: [400, 100, 400, 100, 600],

  // Urgent incoming dispatch pulse pattern for new job requests
  NEW_JOB_REQUEST: [150, 70, 200, 70, 300],

  // Crisp tactile confirmation for status changes (Accept, En Route, Arrived)
  STATUS_UPDATE: [50, 60, 60],

  // Celebratory triple-pulse for OTP verified and job completed
  SUCCESS: [60, 50, 100, 50, 150],

  // Subdued double pulse for decline or cancellation
  WARNING: [120, 60, 120],

  // Light single tap for UI toggles, mic dictation, and tab switching
  LIGHT_TAP: 30,

  // Medium single tap for primary buttons
  MEDIUM_TAP: 50,
} as const;

export type HapticType = keyof typeof HAPTIC_PATTERNS;

/**
 * Safely triggers navigator.vibrate() if supported by the browser/device.
 * Gracefully ignores environments without vibration hardware or policy blocks.
 */
export function triggerHaptic(
  pattern: number | readonly number[] | number[] = HAPTIC_PATTERNS.LIGHT_TAP
): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      const result = navigator.vibrate(pattern as VibratePattern);
      return result;
    }
  } catch (err) {
    // navigator.vibrate might throw in sandboxed iframes or without active user gesture
    console.debug('Haptic vibration not supported or disabled:', err);
  }

  return false;
}

/**
 * Checks if navigator.vibrate() is available on the current device.
 */
export function isHapticsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'vibrate' in navigator &&
    typeof navigator.vibrate === 'function'
  );
}
