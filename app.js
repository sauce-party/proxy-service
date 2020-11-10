const express = require('express')
const routes = require('./handlers')
const {PORT} = require('./settings')

const app = express()
app.use(express.json())

// HTTP routes
app.all('/wd/hub*', async (req, res) => {
    // Handle new session creation
    if (req.url === '/wd/hub/session') {
        return await routes.createSession(req, res)
    }
    // Handle remove session
    if (req.method === 'DELETE' && req.url.match(/wd\/hub\/session\/(.+?)$/)) {
        return await routes.removeSession(req, res)
    }
    // Handle regular WD requests
    return await routes.commonRequest(req, res)
})

// Ignite Web server
app.listen(PORT)
