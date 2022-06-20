/**
 * Print the status and DAG size of a CID from IPFS Cluster. Status is expressed
 * as a Pinning Services API status: "queued"/"pinning"/"pinned"/"failed" which
 * is derived from the "most progressed" status among all nodes in the Cluster.
 *
 * Usage:
 *     node cluster-single-status.js bafybeia4eil5y73ooy3e7mhyk5dvcaml3ket64q6f6u5z4ozbxctw53r6i
 */
import dotenv from 'dotenv'
import { Cluster } from '@nftstorage/ipfs-cluster'
import fetch from '@web-std/fetch'
import * as d3 from 'd3-format'
import { toPSAStatus } from './lib/cluster.js'

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
