/**
 * Upload a set of files to a directory in IPFS Cluster.
 *
 * Usage:
 *     node cluster-upload.js path/to/file0 [...files]
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

  const files = []
  for (let i = 2; i < process.argv.length; i++) {
    const data = await fs.readFile(process.argv[i])
    files.push(new File([data], path.basename(process.argv[i])))
  }
  if (!files.length) {
    throw new Error('missing files list')
  }

  const headers = process.env.CLUSTER_HEADERS ? JSON.parse(process.env.CLUSTER_HEADERS) : {}
  const cluster = new Cluster(process.env.CLUSTER_URL, { headers })

  try {
    const res = await cluster.addDirectory(files)
    console.log(res)
  } catch (err) {
    console.error(err)
    if (err.response) console.error(await err.response.text())
  }
}

main()
