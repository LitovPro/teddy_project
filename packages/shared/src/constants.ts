export const LOYALTY_TARGET = 5;
export const VOUCHER_VALID_DAYS = 30;
export const VISIT_CODE_TTL_MINUTES = 10;
export const RAPID_VISIT_BLOCK_MINUTES = 5;

export const CLIENT_CODE_PREFIX = 'TF';
export const VOUCHER_CODE_LENGTH = 8;

export const QUIET_HOURS = {
  START: 21, // 21:00
  END: 8,    // 08:00
};

export const IMAGE_DIMENSIONS = {
  WIDTH: 1200,
  HEIGHT: 628,
};

export const BRAND_COLORS = {
  PRIMARY: '#8B4513',     // Brown
  SECONDARY: '#228B22',   // Forest Green
  ACCENT: '#FFD700',      // Gold
  BACKGROUND: '#F5F5DC',  // Beige
  TEXT: '#2F4F4F',        // Dark Slate Gray
};

export const WABA_MESSAGE_TYPES = {
  TEXT: 'text',
  INTERACTIVE: 'interactive',
  IMAGE: 'image',
  DOCUMENT: 'document',
} as const;

export const SUBSCRIPTION_TOPICS = {
  EVENTS: 'events',
  PROMOS: 'promos',
} as const;
