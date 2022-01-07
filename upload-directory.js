/**
 * Pack a CAR file and upload to nft.storage.
 *
 * Usage:
 *     MAX_CONCURRENT_UPLOADS=5 API_KEY="<whatever>" node upload-directory.js ./test/data/1-file-directory
 */
import { readFile } from "fs/promises"
import { promisify } from "util"

import dotenv from "dotenv"
import { Semaphore } from "await-semaphore"
import recursive from "recursive-readdir"
import chalk from 'chalk'
import { NFTStorage, File } from "nft.storage"

const timeout = promisify(setTimeout)

//lots of dummy data to test the uploader
const storeFiles = async ({ endpoint, token, path, maxConcurrentUploads }) => {
  const image = new File(await readFile(process.cwd() + "/status.js"), "status.js", { type: "image/jpg" })
  const limiter = new Semaphore(maxConcurrentUploads)

  const client = new NFTStorage({ endpoint, token })

  const files = await recursive(path)

  for (const file of files) {
    const release = await limiter.acquire()
    const fileProps = {
      name: file,
      image,
      description: "aaron's fancy uploader",
      properties: {
        file: new File(await readFile(file, "utf8"), file, { type: "text/plain" })
      }
    }
    retryClientStore(client, fileProps).then(console.table).finally(release) //finally, sweet release.
  }
}

const retryClientStore = async (client, fileProps, timeToWait = 500) => {
  console.log(`uploading ${fileProps.name}...`)
  try {
    return await client.store(fileProps)
  } catch (e) {
    // console.log(`error uploading ${fileProps.name}: ${e.message}`)
    timeToWait *= (1 + Math.random()) // backoff rate, adding some jitter. Should help the concurrency figure itself out.
    console.error(chalk.red(`will retry uploading ${fileProps.name} in ${timeToWait}ms`))
    await timeout(timeToWait)
    return retryClientStore(client, fileProps, timeToWait)
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
  const maxConcurrentUploads = process.env.MAX_CONCURRENT_UPLOADS || 3
  await storeFiles({ endpoint, token, path: filePath, maxConcurrentUploads })
}

main()
