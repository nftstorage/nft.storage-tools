import fs from 'fs'
import ora from 'ora'
import { pipeline } from 'stream/promises'
import rc from 'rc'
import d3 from 'd3-format'
import batch from 'it-batch'
import fetch from 'node-fetch'
import split from './lib/split.js'

const conf = rc('nft.storage-tools')
const format = d3.format(',')
const CONCURRENCY = 10

async function main () {
  if (!conf.apiKey) {
    throw new Error('missing nft.storage API key')
  }

  const filePath = process.argv[2]
  if (!filePath) {
    throw new Error('missing path to newline delimited CID list')
  }

  const endpoint = conf.endpoint || 'https://nft.storage'
  const pinsURL = new URL('api/pins', endpoint).toString()
  console.log(`🔌 Using endpoint: ${endpoint}`)

  const spinner = ora()
  const start = Date.now()
  const totals = { total: 0, running: 0, requests: 0, reqsPerSec: 0 }

  spinner.start()
  try {
    await pipeline(
      fs.createReadStream(filePath),
      split,
      cids => batch(cids, CONCURRENCY),
      async batchedCids => {
        for await (const cids of batchedCids) {
          totals.total += cids.length
          totals.running += cids.length
          spinner.text = toText('Importing...', totals)
          await Promise.all(cids.map(async cid => {
            try {
              const res = await fetch(pinsURL, {
                method: 'POST',
                headers: { Authorization: `Bearer ${conf.apiKey}` },
                body: JSON.stringify({ cid })
              })
              if (!res.ok) {
                const text = await res.text()
                console.log(Object.fromEntries(res.headers.entries()))
                throw new Error(`pinning ${cid}: ${res.status} ${res.statusText}: ${text}`)
              }
              await res.text()
            } finally {
              totals.running--
              totals.requests++
              totals.reqsPerSec = totals.requests / ((Date.now() - start) / 1000)
            }
            spinner.text = toText('Importing...', totals)
          }))
          await new Promise(resolve => setTimeout(resolve, 500))
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
  const items = [`💖 Total: ${format(totals.total)}`]
  if (totals.running) {
    items.push(`📌 Pinning: ${totals.running}`)
  }
  items.push(`🔁 Requests/sec: ${totals.reqsPerSec.toFixed(1)}`)
  return `${prefix}\n${items.join('\n')}`
}

main()
