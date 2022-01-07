/**
 * Pack a CAR file and upload to nft.storage.
 *
 * Usage:
 *     node upload-as-car.js path/to/file
 */
import { readFile } from "fs/promises"
import dotenv from "dotenv"
import { NFTStorage, File } from "nft.storage"
import recursive from "recursive-readdir"
import { Semaphore } from 'await-semaphore'

const storeFiles = async ({ endpoint, token, path, maxConcurrentUploads }) => {
  const image =  new File(await readFile(process.cwd() + "/status.js"), "status.js", {type:"image/jpg"})
  const limiter = new Semaphore(maxConcurrentUploads)

  const client = new NFTStorage({ endpoint, token })
  const files = await recursive(path)
  for (const file of files) {
    const release = await limiter.acquire()
    try {
      client.store({
        name: file,
        image,
        description: "aaron's fancy uploader",
        properties: {
          file: new File(await readFile(file), file)
        }
      })
    } catch (e) {
      console.error(e)
    } finally {
      release()
    }
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
  const maxConcurrentUploads = process.env.MAX_CONCURRENT_UPLOADS || 5
  await storeFiles({ endpoint, token, path: filePath, maxConcurrentUploads })
}

main()
