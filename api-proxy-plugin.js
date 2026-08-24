// api-proxy-plugin.js
import { loadEnv } from 'vite'

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(payload))
}

function withVercelHelpers(res) {
    res.status = (code) => { res.statusCode = code; return res }
    res.json = (payload) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(payload))
        return res
    }
    return res
}

async function readBody(req) {
    return new Promise((resolve) => {
        let data = ''
        req.on('data', (chunk) => { data += chunk })
        req.on('end', () => {
            if (!data) return resolve({})
            try { resolve(JSON.parse(data)) } catch { resolve({}) }
        })
        req.on('error', () => resolve({}))
    })
}

export default function apiProxyPlugin() {
    return {
        name: 'api-proxy',
        configureServer(server) {
            const env = loadEnv('development', process.cwd(), '')
            // make sure GA_PROPERTY_ID / GA_SERVICE_ACCOUNT_B64 / SMTP_* from .env reach process.env in dev
            for (const [key, value] of Object.entries(env)) {
                if (process.env[key] === undefined) process.env[key] = value
            }

            console.log('🔧 API Proxy Ready (wix-data, ga-data, ga-realtime, send-report)')

            server.middlewares.use(async (req, res, next) => {
                const url = new URL(req.url, `http://${req.headers.host}`)

                // --- Wix proxy ---
                if (url.pathname === '/api/wix-data') {
                    const collection = url.searchParams.get('collection')
                    const headers = {
                        'Content-Type': 'application/json',
                        Authorization: env.WIX_API_KEY,
                        'wix-site-id': env.WIX_SITE_ID
                    }
                    try {
                        const response = await fetch('https://www.wixapis.com/wix-data/v1/items/query', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                                dataCollectionId: collection,
                                query: { paging: { limit: 1000 } }
                            })
                        })
                        const bodyText = await response.text()
                        res.statusCode = response.status
                        res.setHeader('Content-Type', 'application/json')
                        res.end(bodyText)
                    } catch (err) {
                        console.error('Wix proxy error:', err.message)
                        sendJson(res, 500, { error: err.message })
                    }
                    return
                }

                // --- Local passthrough for the Vercel-style /api handlers ---
                const routeMap = {
                    '/api/ga-data': './api/ga-data.js',
                    '/api/ga-realtime': './api/ga-realtime.js',
                    '/api/send-report': './api/send-report.js',
                }

                if (!routeMap[url.pathname]) return next()

                try {
                    const mod = await server.ssrLoadModule(routeMap[url.pathname])
                    const handler = mod.default
                    req.query = Object.fromEntries(url.searchParams.entries())
                    if (req.method === 'POST') req.body = await readBody(req)
                    withVercelHelpers(res)
                    await handler(req, res)
                } catch (err) {
                    console.error(`API route ${url.pathname} crashed:`, err)
                    sendJson(res, 500, { error: err.message })
                }
            })
        }
    }
}