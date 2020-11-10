module.exports = {

    /**
     * Port that will be exposed to access proxy-app
     */
    PORT: process.env.PORT || 80,

    /**
     * Redis host which will be used as data persistence. Default port is used to connect 6379
     */
    REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',

    /**
     * Time in ms that defines period in which ticket should be used for new session creation
     */
    SESSION_TTL: process.env.SESSION_TTL || 60000,

    /**
     * Maximum allowed time for session creation. Reaching it will release booked slot
     */
    SESSION_CREATION_TIMEOUT: process.env.SESSION_CREATION_TIMEOUT || 180000,

    /**
     * Hub url that will be used for calls delegation
     */
    TARGET_URL: process.env.TARGET_URL
}
