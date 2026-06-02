/**
 * Session management utilities for tracking anonymous visitors
 * Generates and stores a unique session ID in localStorage
 */

const SESSION_STORAGE_KEY = 'ttb_session_id';
const SESSION_EXPIRY_DAYS = 30; // Session expires after 30 days

/**
 * Get or create a session ID for the current visitor
 * @returns The session ID (UUID v4 format)
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    // Check if session already exists
    let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);

    if (sessionId) {
      // Check if session is still valid (not expired)
      const sessionData = JSON.parse(sessionId);
      const createdAt = new Date(sessionData.createdAt);
      const now = new Date();
      const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceCreation < SESSION_EXPIRY_DAYS) {
        return sessionData.id;
      }
    }

    // Generate new session ID
    const newSessionId = generateUUID();
    const sessionData = {
      id: newSessionId,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    return newSessionId;
  } catch (error) {
    console.error('Error managing session ID:', error);
    return '';
  }
}

/**
 * Generate a UUID v4
 * @returns A random UUID string
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for browsers without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Clear the current session ID (for testing purposes)
 */
export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing session ID:', error);
    }
  }
}
