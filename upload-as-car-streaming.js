/**
 * Pack a CAR file and upload to nft.storage.
 *
 * Usage:
 *     node upload-as-car.js path/to/file
 */
import { PassThrough } from "stream"
import dotenv from "dotenv"
import fetch from "node-fetch"
import { NFTStorage } from "nft.storage"

import { packToStream } from "ipfs-car/pack/stream"
import { FsBlockStore } from "ipfs-car/blockstore/fs"


const storeStream = async ({ endpoint, token, path,chunkSize }) => {
  const url = new URL("upload/", endpoint)
  const stream = new PassThrough()
  
  const sendIt = async (buffer) => {
    console.log("sending", buffer.length)
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: NFTStorage.auth(token),
      body: buffer,
    })
    const result = await response.json()
    console.log("sendIt", result)
  }

  packToStream({
    input: path,
    writable: stream,
    blockstore: new FsBlockStore()
  })
  let buffer = []
  
  for await (const chunk of stream) {
    buffer = [...buffer, ...chunk]
    if(buffer.length > chunkSize) {
      sendIt(buffer)
      buffer = []
    }
  }

  sendIt(buffer)


  
  console.log(await response.json())
  // console.log(`read: ${stream.bytesRead} bytes`)
  // if (result.ok) {
  //   return result.value.cid
  // } else {
  //   throw new Error(result.error.message)
  // }
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
  const chunkSize = process.env.CHUNK_SIZE || 1024 * 1024 * 10
  await storeStream({ endpoint, token, path: filePath, chunkSize })
}

main()
