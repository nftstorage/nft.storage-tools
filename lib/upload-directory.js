import { readFile } from "fs/promises";
import { promisify } from "util";
import chalk from "chalk";
// import {partial} from "ramda";
import { Semaphore } from "await-semaphore";
import recursive from "recursive-readdir";
import { partial } from "ramda";
import { NFTStorage, File } from "nft.storage";

const timeout = promisify(setTimeout);

export const uploadDirectory = async ({ endpoint, token, path, maxConcurrentUploads, maxTimeout = 60000 }) => {
  const startTime = Date.now();
  const image = new File(await readFile(process.cwd() + "/status.js"), "status.js", { type: "image/jpg" });
  const limiter = new Semaphore(maxConcurrentUploads);
  const client = new NFTStorage({ endpoint, token });

  const store = partial(retryClientStore, [client, maxTimeout]);

  const files = await recursive(path);

  let filesFinished = 0;
  let timeBetweenCalls = 1;

  for (const file of files) {
    const release = await limiter.acquire();
    const fileProps = {
      name: file,
      image,
      description: `uploaded from ${file}`,
      properties: {
        file: new File(await readFile(file, "utf8"), file, { type: "text/plain" }),
      },
    };

    const logData = (newTimeout) => {
      console.clear();
      console.table(getViewModel(files.length, startTime, newTimeout, filesFinished, file));
      timeBetweenCalls = newTimeout;
      filesFinished++
      return newTimeout;
    };

    store(timeBetweenCalls, fileProps).then(logData).finally(release);
  }
};

const retryClientStore = async (client, maxTimeout, timeToWait, fileProps) => {
  try {
    await client.store(fileProps);
    return Math.random() > 0.99 ? timeToWait * 0.9 : timeToWait; // slowly speed up uploads about 1% of the time
  } catch (e) {
    timeToWait *= 1 + Math.random();

    if (timeToWait > maxTimeout) timeToWait = maxTimeout * (1 + Math.random());

    console.error(chalk.red(`Error: ${e.message}. will retry uploading ${fileProps.name} in ${timeToWait}ms`));
    await timeout(timeToWait);
    return retryClientStore(client, maxTimeout, timeToWait, fileProps);
  }
};

const getViewModel = (numberOfFiles, startTime, newTimeout, filesFinished, fileName) => {
  return {
    newTimeout,
    fileName: fileName,
    filesFinished: filesFinished,
    filesTotal: numberOfFiles,
    filePercent: (filesFinished / numberOfFiles) * 100,
    filesPerSecond: filesFinished / ((Date.now() - startTime) / 1000),
  };
};
