const redis = require("redis")
const {promisify} = require("util")
const {REDIS_HOST, SESSION_TTL, SESSION_CREATION_TIMEOUT} = require('./settings')

const client = redis.createClient({host: REDIS_HOST});

client.on('ready', () => console.info(`Connected to Redis at ${REDIS_HOST}:6379`));
client.on('error', error => console.error(error));

// Wrapped client methods
const keys = promisify(client.keys).bind(client)
const rename = promisify(client.rename).bind(client)
const expire = promisify(client.pexpire).bind(client)
const del = promisify(client.del).bind(client)

module.exports = {

    /**
     * Turns booked session into real one
     *
     * @return true if booking was successful, false otherwise
     */
    upgrade: async function (virtual, real) {
        try {
            const from = await keys([`s:*:${virtual}`])
            if (from.length === 1) {
                const to = from[0].match('^(s:.*?:).+?$')[1] + real
                return await rename([from[0], to]) && await this.renew(real, SESSION_TTL)
            }
            return false
        } catch (e) {
            console.error(`Unable to upgrade session ${e}`)
            return false
        }
    },

    /**
     * Updates session last activity
     *
     * @return true if renewing was successful, false otherwise
     */
    renew: async function (session, time) {
        try {
            const keysFound = await keys([`s:*:${session}`])
            return keysFound.length === 1 && await expire([keysFound[0], time])
        } catch (e) {
            console.error(`Unable to renew ${e}`)
            return false
        }
    },

    /**
     * Turns ticket into booked session
     *
     * @return true if renewing was successful, false otherwise
     */
    book: async function (ticket) {
        try {
            const keysFound = await keys([`t:*:${ticket}`])
            if (keysFound.length === 1) {
                const from = keysFound[0]
                const to = 's' + from.slice(1)
                return await rename([from, to]) && await this.renew(ticket, SESSION_CREATION_TIMEOUT)
            }
            return false
        } catch (e) {
            console.error(`Unable to book session ${e}`)
            return false
        }
    },

    /**
     * Removes session quited
     */
    remove: async function (session) {
        try {
            const result = await keys([`*:*:${session}`])
            if (result.length === 1) {
                await del([result[0]])
            }
        } catch (e) {
            console.error(`Unable to remove session ${e}`)
        }
    }
}
