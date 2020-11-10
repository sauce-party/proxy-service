const got = require('got')
const {TARGET_URL} = require('./settings')

if (!TARGET_URL) {
    throw 'TARGET_URL environment variable must be defined'
}

module.exports = async function (payload) {
    const target = TARGET_URL + payload.url
    // Remove middleware headers
    delete payload.headers['host']
    delete payload.headers['content-length']
    try {
        const options = {
            method: payload.method,
            headers: payload.headers,
        }
        if (payload.method !== 'GET') {
            options.json = payload.body
        }
        return await got(target, options)
    } catch (e) {
        console.error(e)
    }
}
