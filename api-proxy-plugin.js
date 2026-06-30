// api-proxy-plugin.js
import { loadEnv } from 'vite'

export default function apiProxyPlugin() {
    return {
        name: 'api-proxy',
        configureServer(server) {
            const env = loadEnv('development', process.cwd(), '')
            console.log('🔧 Wix Proxy Ready')

            server.middlewares.use(async (req, res, next) => {
                if (!req.url.startsWith('/api/wix-data')) return next()

                const url = new URL(req.url, `http://${req.headers.host}`)
                const collection = url.searchParams.get('collection')

                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': env.WIX_API_KEY,
                    'wix-site-id': env.WIX_SITE_ID
                }

                try {
                    // Force the Wix REST API query engine to lift its default 50-item threshold
                    const response = await fetch('https://www.wixapis.com/wix-data/v1/items/query', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            dataCollectionId: collection,
                            query: {
                                paging: {
                                    limit: 1000
                                }
                            }
                        })
                    })

                    const bodyText = await response.text()
                    res.statusCode = response.status
                    res.setHeader('Content-Type', 'application/json')
                    res.end(bodyText)
                } catch (err) {
                    console.error('Proxy Error:', err.message)
                    res.statusCode = 500
                    res.end(JSON.stringify({ error: err.message }))
                }
            })
        }
    }
}