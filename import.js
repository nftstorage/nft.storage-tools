/**
 * Import a pinlist (newline separated list of CIDs) into nft.storage.
 *
 * Usage:
 *     node import.js pinlist.txt
 *     # start from line 1000
 *     node import.js pinlist.txt --start 1000
 */
import fs from 'fs'
import ora from 'ora'
import { pipeline } from 'stream/promises'
import dotenv from 'dotenv'
import * as d3 from 'd3-format'
import fetch from '@web-std/fetch'
import { RateLimiter } from 'limiter'
import retry from 'p-retry'
import AbortController from 'abort-controller'
import batch from 'it-batch'
import split from './lib/split.js'
import drop from './lib/drop.js'

dotenv.config()

const format = d3.format(',')
const BATCH_SIZE = 1000 // process CIDs in batches of this size
const RATE_LIMIT = [2, /* per */ 'second'] // rate limit requests to nft.storage
const RETRIES = 5 // failed request retries

function parseArgs () {
  const apiKey = process.env.API_KEY
  if (!apiKey) throw new Error('missing nft.storage API key')

  const filePath = process.argv[2]
  if (!filePath) throw new Error('missing path to newline delimited CID list')

  let startLine = 0
  if ((process.argv[3] || '').startsWith('--start')) {
    startLine = parseInt(process.argv[3] === '--start' ? process.argv[4] : process.argv[3].split('=')[1])
  }

  const endpoint = process.env.ENDPOINT || 'https://api.nft.storage'
  return { endpoint, apiKey, filePath, startLine }
}

async function main () {
  const { endpoint, apiKey, filePath, startLine } = parseArgs()
  const spinner = ora()
  const pinner = new Pinner({ apiKey, endpoint })
  const start = Date.now()
  const totals = { total: 0, running: 0, requests: 0, reqsPerSec: 0 }
  console.log(`🔌 Using endpoint: ${endpoint}`)

  if (startLine > 0) {
    console.log(`⏩ starting from line ${format(startLine)}`)
  }

  spinner.start()
  try {
    await pipeline(
      fs.createReadStream(filePath),
      split,
      cids => drop(cids, startLine),
      cids => batch(cids, BATCH_SIZE),
      async batchedCids => {
        for await (const cids of batchedCids) {
          await Promise.all(cids.map(async cid => {
            try {
              totals.running++
              spinner.text = toText('Importing...', totals)
              await pinner.pin(cid)
            } finally {
              totals.running--
              totals.total++
              totals.requests++
              totals.reqsPerSec = totals.requests / ((Date.now() - start) / 1000)
              spinner.text = toText('Importing...', totals)
            }
          }))
        }
      }
    )
  } catch (err) {
    spinner.stopAndPersist({ text: toText('Errored', totals) })
    spinner.fail(`Error: ${err.message}`)
    throw err
  }
  spinner.succeed(toText('Complete!', totals))
}

function toText (prefix, totals) {
  const items = [`💖 Total sent: ${format(totals.total)}`]
  if (totals.running) {
    items.push(`📌 Sending: ${totals.running}`)
  }
  items.push(`🔁 Requests/sec: ${totals.reqsPerSec.toFixed(1)}`)
  return `${prefix}\n${items.join('\n')}`
}

class Pinner {
  constructor ({ apiKey, endpoint }) {
    this.apiKey = apiKey
    this.pinsURL = new URL('pins', endpoint).toString()
    this.limiter = new RateLimiter({ tokensPerInterval: RATE_LIMIT[0], interval: RATE_LIMIT[1] })
  }

  async pin (cid) {
    await this.limiter.removeTokens(1)
    const res = await retry(async () => {
      const controller = new AbortController()
      const abortID = setTimeout(() => controller.abort(), 60000)
      try {
        const res = await fetch(this.pinsURL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.apiKey}` },
          body: JSON.stringify({ cid }),
          signal: controller.signal
        })
        const text = await res.text()
        if (!res.ok) {
          throw new Error(`pinning ${cid}: ${res.status}: ${res.statusText}\nHeaders: ${Array.from(res.headers.entries())}\nBody: ${text}`)
        }
      } finally {
        clearTimeout(abortID)
      }
    }, { retries: RETRIES })
    return res
  }
}

main()
