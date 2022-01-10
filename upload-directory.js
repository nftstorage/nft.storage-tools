/**
 * Upload all files in a directory. Recursively searches subdirectories and uploads async.
 *
 * Usage:
 *     MAX_CONCURRENT_UPLOADS=5 API_KEY="<whatever>" node upload-directory.js ./test/data/1-file-directory

 */
import { readFile } from "fs/promises";
import { promisify } from "util";

import dotenv from "dotenv";
import { Semaphore } from "await-semaphore";
import recursive from "recursive-readdir";
import chalk from "chalk";
import { NFTStorage, File } from "nft.storage";

const timeout = promisify(setTimeout);

//lots of dummy data to test the uploader
const storeFiles = async ({ endpoint, token, path, maxConcurrentUploads }) => {
  const startTime = Date.now();

  const image = new File(await readFile(process.cwd() + "/status.js"), "status.js", { type: "image/jpg" });
  const limiter = new Semaphore(maxConcurrentUploads);
  const client = new NFTStorage({ endpoint, token });

  const files = await recursive(path);

  let filesFinished = 0;
  let timeBetweenCalls = 500;
  for (const file of files) {
    const release = await limiter.acquire();
    const fileProps = {
      name: file,
      image,
      description: "aaron's fancy uploader",
      properties: {
        file: new File(await readFile(file, "utf8"), file, { type: "text/plain" }),
      },
    };
    const logData = (newTimeout) => {      
      console.clear()
      console.table({
        newTimeout,
        fileName: file,
        filesFinished: filesFinished++,
        filesTotal: files.length,
        filePercent: (filesFinished / files.length) * 100,
        filesPerSecond: filesFinished / ((Date.now() - startTime) / 1000),
      });
      return newTimeout
    };        
    retryClientStore(client, fileProps, 500)
      .then(logData)      
      .then((timeWaited) => {                
        timeBetweenCalls = timeWaited;       
        if (Math.random() > 0.999) timeBetweenCalls = timeBetweenCalls/2
      }).finally(release)
  }
};

const retryClientStore = async (client, fileProps, timeToWait = 500) => {
  try {
    await client.store(fileProps);
    return timeToWait;
  } catch (e) {
    timeToWait *= 1 + Math.random(); // backoff rate, adding some jitter. Should help the concurrency figure itself out.
    
    if (timeToWait > 60 * 1000) timeToWait = 60 * 1000 * (1 + Math.random()); // cap at 1-2 minutes

    console.error(chalk.red(`will retry uploading ${fileProps.name} in ${timeToWait}ms`));
    await timeout(timeToWait);
    return retryClientStore(client, fileProps, timeToWait);
  }
};

dotenv.config();

async function main() {
  const token = process.env.API_KEY;
  if (!token) {
    throw new Error("missing nft.storage API key");
  }

  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error("missing file argument");
  }

  const endpoint = process.env.ENDPOINT || "https://api.nft.storage";
  const maxConcurrentUploads = process.env.MAX_CONCURRENT_UPLOADS || 3;
  await storeFiles({ endpoint, token, path: filePath, maxConcurrentUploads });
}

main();
