const storage = require('./storage')
const proxyRequest = require('./proxy')
const {SESSION_TTL} = require('./settings')

async function createSession(req, res) {
    // Check ticket
    const ticketId = req.body.desiredCapabilities['ticket']
    if (!await storage.book(ticketId)) {
        res.statusCode = 401
        res.json(generateError(401, 'Ticket is invalid or absent'))
        return res.end()
    }
    // Create real session
    const response = await proxyRequest(req)
    if (!response) {
        res.json(generateError(500, "Session wasn't created"))
        return res.end()
    }
    const body = JSON.parse(response.body)
    // Extract session id for W3C or OSS protocols
    const id = body.value.sessionId || body.sessionId
    if (id) {
        // Update slot with session id and expiration time
        await storage.upgrade(ticketId, id)
    } else {
        // Remove session
        await storage.remove(ticketId)
    }
    // Response to client
    res.json(body)
    return res.end()
}

async function removeSession(req, res) {
    const quitResponse = await proxyRequest(req)
    if (!quitResponse) {
        res.json(generateError(500, "Unable to delete session"))
        return res.end()
    }
    res.send(quitResponse.body)
    res.statusCode = quitResponse.statusCode
    res.statusMessage = quitResponse.statusMessage
    // Update storage
    const id = req.url.match(/wd\/hub\/session\/(.+?)$/)[1]
    await storage.remove(id)
    return res.end()
}

async function commonRequest(req, res) {
    const match = req.url.match(/wd\/hub\/session\/(.+?)\/.+?$/)
    if (!match) {
        res.statusCode = 400
        res.json(generateError(400, 'Unknown request detected'))
        return res.end()
    }
    // Check session exists
    if (!await storage.renew(match[1], SESSION_TTL)) {
        res.statusCode = 401
        res.json(generateError(401, 'Session id is wrong or expired'))
        return res.end()
    }
    // Real request
    let response = await proxyRequest(req)
    if (!response) {
        res.statusCode = 500
        res.json(generateError(500, 'Failed to make request to upstream server'))
        return res.end()
    }
    res.statusCode = response.statusCode
    res.statusMessage = response.statusMessage
    res.send(response.body)
}

function generateError(code, message) {
    return {
        status: code,
        value: {
            message: message,
            error: message
        }
    }
}

module.exports = {
    createSession: createSession,
    removeSession: removeSession,
    commonRequest: commonRequest
}
