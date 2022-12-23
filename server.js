const puppeteer = require('puppeteer')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const path = require('path')
const compression = require('compression')
const express = require('express')
const cors = require('cors')

const app = express()
app.enable('trust proxy')

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

const PORT = process.env.PORT || 6969

let page

puppeteer.launch({ headless: true }).then(async (browser) => {
  page = await browser.newPage()
  console.log('Launched page.')
})

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname })
})

app.get('/downloadInfo', async (req, res) => {
  let { url } = req.query

  if (!url) return res.status(400).send('missing url.')

  url = new URL(url)
  if (!url.hostname.includes('tiktok.com'))
    return res.status(400).json({
      message: 'Bad',
    })

  await page.goto(url, { isolation: 'origin' })

  const result = await page.evaluate(() => {
    const thumbNail = document.querySelector('img')?.getAttribute('src')
    const videoUrl = document.querySelector('video')?.getAttribute('src')

    return {
      thumbNail,
      videoUrl,
    }
  })

  res.json(result)
})

app.listen(PORT, () => console.log(`app listening on port ${PORT}`))
