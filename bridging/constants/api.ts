/**
 * API Configuration Constants
 */

export const API_CONFIG = {
    BASE_URL: 'https://production-model.onrender.com',
    ENDPOINTS: {
        PREDICT: '/predict',
    },
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
} as const;
