import fs from 'fs'
import ora from 'ora'
import { pipeline } from 'stream/promises'
import dotenv from 'dotenv'
import d3 from 'd3-format'
import { Cluster } from '@nftstorage/ipfs-cluster'
import batch from 'it-batch'
import fetch from 'node-fetch'
import split from './lib/split.js'

global.fetch = fetch

dotenv.config()
const format = d3.format(',')
const CONCURRENCY = 1000

async function main () {
  if (!process.env.CLUSTER_URL) {
    throw new Error('missing IPFS Cluster URL')
  }

  const filePath = process.argv[2]
  if (!filePath) {
    throw new Error('missing path to newline delimited CID list')
  }

  console.log(`🔌 Using IPFS Cluster URL: ${process.env.CLUSTER_URL}`)

  const headers = process.env.CLUSTER_HEADERS ? JSON.parse(process.env.CLUSTER_HEADERS) : {}
  const cluster = new Cluster(process.env.CLUSTER_URL, { headers })
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
              const status = toPSAStatus(await cluster.status(cid))
              totals[status]++
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

function toPSAStatus (status) {
  const pinInfos = Object.values(status.peerMap)
  if (pinInfos.some((i) => i.status === 'pinned')) return 'pinned'
  if (pinInfos.some((i) => i.status === 'pinning')) return 'pinning'
  if (pinInfos.some((i) => i.status === 'queued')) return 'queued'
  return 'failed'
}

main()
