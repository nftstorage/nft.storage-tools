/**
 * Pretty print the pin status of all the CIDs in the passed pinlist file.
 *
 * Usage:
 *     node status.js pinlist.txt
 */
import fs from 'fs'
import ora from 'ora'
import { pipeline } from 'stream/promises'
import dotenv from 'dotenv'
import * as d3 from 'd3-format'
import { NFTStorage } from 'nft.storage'
import batch from 'it-batch'
import split from './lib/split.js'

dotenv.config()
const format = d3.format(',')
const CONCURRENCY = 1000

async function main () {
  if (!process.env.API_KEY) {
    throw new Error('missing nft.storage API key')
  }

  const filePath = process.argv[2]
  if (!filePath) {
    throw new Error('missing path to newline delimited CID list')
  }

  const endpoint = process.env.ENDPOINT || 'https://api.nft.storage'
  console.log(`🔌 Using endpoint: ${endpoint}`)

  const store = new NFTStorage({ token: process.env.API_KEY, endpoint })
  const spinner = ora()
  const start = Date.now()
  const totals = { total: 0, queued: 0, pinning: 0, pinned: 0, failed: 0, unknown: 0, requests: 0, reqsPerSec: 0 }
  const retryables = { failed: [], unknown: [] }

  spinner.start()
  try {
    await pipeline(
      fs.createReadStream(filePath),
      split,
      cids => batch(cids, CONCURRENCY),
      async batchedCids => {
        for await (const cids of batchedCids) {
          await Promise.all(cids.map(async cid => {
            try {
              const { pin } = await store.status(cid)
              totals[pin.status]++
              if (pin.status === 'failed') {
                retryables.failed.push(cid)
              }
            } catch (err) {
              if (err.message.contains('not found')) {
                totals.unknown++
                retryables.unknown.push(cid)
              } else {
                throw err
              }
            } finally {
              totals.total++
              totals.requests++
              totals.reqsPerSec = totals.requests / ((Date.now() - start) / 1000)
            }
            spinner.text = toText('Loading...', totals)
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

  if (retryables.failed.length) {
    console.log('\n💀 Failed CIDs:')
    retryables.failed.forEach(cid => console.log(cid))
  }
  if (retryables.unknown.length) {
    console.log('\n❓ Unknown CIDs:')
    retryables.failed.forEach(cid => console.log(cid))
  }
}

const percent = (value, total) => ((value / total) * 100).toFixed()

function toText (prefix, totals) {
  const items = [`💖 Total: ${format(totals.total)}`]
  if (totals.queued) {
    items.push(line('👫 Queued', totals.queued, totals.total))
  }
  if (totals.pinning) {
    items.push(line('⏳ Pinning', totals.pinning, totals.total))
  }
  if (totals.pinned) {
    items.push(line('📌 Pinned', totals.pinned, totals.total))
  }
  if (totals.failed) {
    items.push(line('💀 Failed', totals.failed, totals.total))
  }
  if (totals.unknown) {
    items.push(line('❓ Unknown', totals.unknown, totals.total))
  }
  items.push(`🔁 Requests/sec: ${totals.reqsPerSec.toFixed(1)}`)
  return `${prefix}\n${items.join('\n')}`
}

const line = (prefix, value, total) => `${prefix}: ${value} (${percent(value, total)}%)`

main()
