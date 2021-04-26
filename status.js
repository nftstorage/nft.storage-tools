import fs from 'fs'
import ora from 'ora'
import { pipeline } from 'stream/promises'
import rc from 'rc'
import d3 from 'd3-format'
import { NFTStorage } from 'nft.storage'
import batch from 'it-batch'
import split from './lib/split.js'

const conf = rc('nft.storage-tools')
const format = d3.format(',')
const CONCURRENCY = 1000

async function main () {
  if (!conf.apiKey) {
    throw new Error('missing nft.storage API key')
  }

  const filePath = process.argv[2]
  if (!filePath) {
    throw new Error('missing path to newline delimited CID list')
  }

  const endpoint = conf.endpoint || 'https://nft.storage'
  console.log(`🔌 Using endpoint: ${endpoint}`)

  const store = new NFTStorage({ token: conf.apiKey, endpoint })
  const spinner = ora()
  const start = Date.now()
  const totals = { total: 0, queued: 0, pinning: 0, pinned: 0, failed: 0, unknown: 0, requests: 0, reqsPerSec: 0 }

  spinner.start()
  try {
    await pipeline(
      fs.createReadStream(filePath),
      split,
      cids => batch(cids, CONCURRENCY),
      async batchedCids => {
        for await (const cids of batchedCids) {
          totals.total += cids.length
          spinner.text = toText('Loading...', totals)
          await Promise.all(cids.map(async cid => {
            try {
              const { pin } = await store.status(cid)
              totals[pin.status]++
            } catch (err) {
              if (err.message === 'not found') {
                totals.unknown++
              } else {
                throw err
              }
            } finally {
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
