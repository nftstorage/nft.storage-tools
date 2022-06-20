/**
 * Upload a CAR file to IPFS Cluster.
 *
 * TODO: CAR is buffered in memory
 *
 * Usage:
 *     node cluster-car-upload.js path/to/file.car
 */
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'
import { Cluster } from '@nftstorage/ipfs-cluster'
import fetch from '@web-std/fetch'
import { FormData } from '@web-std/form-data'
import { File, Blob } from '@web-std/file'

Object.assign(global, { fetch, File, Blob, FormData })

dotenv.config()

async function main () {
  if (!process.env.CLUSTER_URL) {
    throw new Error('missing IPFS Cluster URL')
  }

  console.log(`🔌 Using IPFS Cluster URL: ${process.env.CLUSTER_URL}`)

  const carPath = process.argv[2]
  if (!carPath) {
    throw new Error('missing CAR file argument')
  }

  const data = await fs.readFile(carPath)
  const file = new File([data], path.basename(carPath), { type: 'application/car' })

  const headers = process.env.CLUSTER_HEADERS ? JSON.parse(process.env.CLUSTER_HEADERS) : {}
  const cluster = new Cluster(process.env.CLUSTER_URL, { headers })

  try {
    const res = await cluster.addCAR(file, { local: true })
    console.log(res)
  } catch (err) {
    console.error(err)
    if (err.response) console.error(await err.response.text())
  }
}

main()
