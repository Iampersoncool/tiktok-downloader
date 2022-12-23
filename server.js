require('dotenv').config()

const puppeteer = require('puppeteer')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const path = require('path')
const compression = require('compression')
const express = require('express')
const cors = require('cors')

const app = express()
app.enable('trust proxy')

const PORT = process.env.PORT || 3000
const isProduction = process.env.NODE_ENV === 'production'

isProduction ? console.log('production') : console.log('not production')

app.use(
  compression({
    threshold: 0,
  })
)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})

app.use(cors())

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      scriptSrc: ["'self'", 'cdnjs.cloudflare.com'],
      styleSrc: ["'self'", 'cdnjs.cloudflare.com'],
      mediaSrc: ["'self'", 'v16m-webapp.tiktokcdn-us.com'],
      defaultSrc: ["'self'"],
    },
  })
)
app.use(limiter)

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname })
})

app.get('/downloadInfo', async (req, res) => {
  try {
    const url = new URL(req.query.url)

    if (!url) throw new Error('No Url.')

    if (!url.hostname.includes('tiktok.com'))
      throw new Error('Url is not tiktok.')

    const browser = isProduction
      ? await puppeteer.connect({
          browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.API_KEY}`,
        })
      : await puppeteer.launch({ headless: true })

    const page = await browser.newPage()

    await page.goto(url)

    const result = await page.evaluate(() => {
      const thumbNail = document.querySelector('img')?.getAttribute('src')
      const videoUrl = document.querySelector('video')?.getAttribute('src')

      return {
        thumbNail,
        videoUrl,
      }
    })

    await browser.close()

    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(400).json({
      message: 'bad request',
    })
  }
})

app.listen(PORT, () => console.log(`app listening on port ${PORT}`))
