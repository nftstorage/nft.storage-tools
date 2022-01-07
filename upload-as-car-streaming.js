/**
 * Pack a CAR file and upload to nft.storage.
 *
 * Usage:
 *     node upload-as-car.js path/to/file
 */
 import { PassThrough, pipeline } from "stream"
import dotenv from "dotenv"
import fetch from "node-fetch"
import { NFTStorage } from "nft.storage"

import { packToStream } from "ipfs-car/pack/stream"
import { FsBlockStore } from "ipfs-car/blockstore/fs"


const storeStream = async ({ endpoint, token, path }) => {
  const url = new URL("upload/", endpoint)
  const stream = new PassThrough()
  
  const fetchPromise = fetch(url.toString(), {
    method: "POST",
    headers: NFTStorage.auth(token),
    body: stream,
  })

  packToStream({
    input: path,
    writable: stream,
    blockstore: new FsBlockStore()
  })


  const result = await fetchPromise
  console.log(JSON.stringify(result))
  if (result.ok) {
    return result.value.cid
  } else {
    throw new Error(result.error.message)
  }
}


dotenv.config()

async function main() {
  const token = process.env.API_KEY
  if (!token) {
    throw new Error("missing nft.storage API key")
  }

  const filePath = process.argv[2]
  if (!filePath) {
    throw new Error("missing file argument")
  }

  const endpoint = process.env.ENDPOINT || "https://api.nft.storage"

  await storeStream({ endpoint, token, path: filePath })
}

main()
