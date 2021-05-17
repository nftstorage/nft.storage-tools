import dotenv from 'dotenv'
import { Cluster } from '@nftstorage/ipfs-cluster'
import fetch from 'node-fetch'
import d3 from 'd3-format'

global.fetch = fetch

dotenv.config()

const format = d3.format(',')

async function main () {
  if (!process.env.CLUSTER_URL) {
    throw new Error('missing IPFS Cluster URL')
  }

  const cid = process.argv[2]
  if (!cid) {
    throw new Error('missing CID argument')
  }

  console.log(`🔌 Using IPFS Cluster URL: ${process.env.CLUSTER_URL}`)

  const headers = process.env.CLUSTER_HEADERS ? JSON.parse(process.env.CLUSTER_HEADERS) : {}
  const cluster = new Cluster(process.env.CLUSTER_URL, { headers })

  console.log(toPSAStatus(await cluster.status(cid)))
  console.log(`${format(await dagSize(cid))} bytes`)
}

main()

function toPSAStatus (status) {
  const pinInfos = Object.values(status.peerMap)
  if (pinInfos.some((i) => i.status === 'pinned')) return 'pinned'
  if (pinInfos.some((i) => i.status === 'pinning')) return 'pinning'
  if (pinInfos.some((i) => i.status === 'queued')) return 'queued'
  return 'failed'
}

async function dagSize (cid) {
  const url = new URL(
    `v0/dag/stat?arg=${encodeURIComponent(cid)}&progress=false`,
    process.env.CLUSTER_URL
  )
  const response = await fetch(url.toString(), {
    headers: process.env.CLUSTER_HEADERS ? JSON.parse(process.env.CLUSTER_HEADERS) : {}
  })
  if (!response.ok) {
    throw Object.assign(
      new Error(`${response.status}: ${response.statusText}`),
      { response }
    )
  }
  const data = await response.json()
  return parseInt(data.Size)
}
