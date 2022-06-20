/**
 * Pin a pinlist (newline separated list of CIDs) to IPFS Cluster.
 *
 * Usage:
 *     node cluster-pin.js pinlist.txt
 */
import fs from 'fs'
import ora from 'ora'
import { pipeline } from 'stream/promises'
import dotenv from 'dotenv'
import * as d3 from 'd3-format'
import batch from 'it-batch'
import fetch from '@web-std/fetch'
import { Cluster } from '@nftstorage/ipfs-cluster'
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
              await cluster.pin(cid)
            } finally {
              totals.running--
              totals.requests++
              totals.reqsPerSec = totals.requests / ((Date.now() - start) / 1000)
            }
            spinner.text = toText('Importing...', totals)
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
  const items = [`💖 Total: ${format(totals.total)}`]
  if (totals.running) {
    items.push(`📌 Pinning: ${totals.running}`)
  }
  items.push(`🔁 Requests/sec: ${totals.reqsPerSec.toFixed(1)}`)
  return `${prefix}\n${items.join('\n')}`
}

main()
