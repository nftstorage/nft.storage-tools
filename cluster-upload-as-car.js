/**
 * Pack a CAR file and upload to IPFS Cluster.
 *
 * TODO: CAR is buffered in memory
 *
 * Usage:
 *     node cluster-upload-as-car.js path/to/file
 */
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import dotenv from 'dotenv'
import { Cluster } from '@nftstorage/ipfs-cluster'
import fetch from '@web-std/fetch'
import { FormData } from '@web-std/form-data'
import { File, Blob } from '@web-std/file'
import { packToFs } from 'ipfs-car/pack/fs'

Object.assign(global, { fetch, File, Blob, FormData })

dotenv.config()

async function main () {
  if (!process.env.CLUSTER_URL) {
    throw new Error('missing IPFS Cluster URL')
  }

  console.log(`🔌 Using IPFS Cluster URL: ${process.env.CLUSTER_URL}`)

  const filePath = process.argv[2]
  if (!filePath) {
    throw new Error('missing file argument')
  }

  const carPath = path.join(os.tmpdir(), `${path.basename(filePath)}.${Date.now()}.car`)
  const { root } = await packToFs({ input: filePath, output: carPath })
  console.log(`🚗 Packed into CAR at: ${carPath}`)
  console.log(`🆔 CID: ${root}`)

  const data = await fs.readFile(carPath)
  const file = new File([data], path.basename(carPath), { type: 'application/car' })

  const headers = process.env.CLUSTER_HEADERS ? JSON.parse(process.env.CLUSTER_HEADERS) : {}
  const cluster = new Cluster(process.env.CLUSTER_URL, { headers })

  try {
    const res = await cluster.add(file, { local: true })
    console.log(res)
  } catch (err) {
    console.error(err)
    if (err.response) console.error(await err.response.text())
  }
}

main()
