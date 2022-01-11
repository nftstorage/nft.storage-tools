import { readFile } from "fs/promises";
import { promisify } from "util";
import chalk from "chalk";
// import {partial} from "ramda";
import { Semaphore } from "await-semaphore";
import recursive from "recursive-readdir";
import { partial } from "ramda";
import { NFTStorage, Blob } from "nft.storage";

const timeout = promisify(setTimeout);

export const uploadDirectory = async ({ endpoint, token, path, maxConcurrentUploads, maxTimeout = 60000 }) => {
  const startTime = Date.now();  
  const limiter = new Semaphore(maxConcurrentUploads);
  const client = new NFTStorage({ endpoint, token });

  const files = await recursive(path);

  // curry the functions to keep state w/o passing it around
  const viewModel = partial(getViewModel, [files.length, startTime, maxConcurrentUploads]);
  const store = partial(retryClientStore, [client, maxTimeout]);

  let filesFinished = 0;
  let timeBetweenCalls = 1;

  for (const fileName of files) {
    const release = await limiter.acquire();
    const file = await readFile(fileName, 'utf8');

    const processData = (newTimeout) => {
      timeBetweenCalls = newTimeout;
      filesFinished++;

      console.clear();
      console.table(viewModel(timeBetweenCalls, filesFinished, fileName));

      return newTimeout;
    };

    store(timeBetweenCalls, file, fileName).then(processData).finally(release);
  }
};

const retryClientStore = async (client, maxTimeout, timeToWait, file, fileName) => {
  try {
    await client.storeBlob(new Blob(file));
    return Math.random() > 0.90 ? timeToWait/2 : timeToWait; // speed up uploads about 10% of the time
  } catch (e) {
    timeToWait *= 1 + Math.random(); //stagger the time between retries

    if (timeToWait > maxTimeout) timeToWait = maxTimeout * (1 + Math.random());

    console.error(chalk.red(`Error: ${e.message}. will retry uploading ${fileName} in ${timeToWait}ms`));
    await timeout(timeToWait);
    return retryClientStore(client, maxTimeout, timeToWait, file, fileName);
  }
};

const getViewModel = (filesTotal, startTime, maxConcurrentUploads, timeBetweenCalls, filesFinished, fileName) => {
  return {
    fileName,  
    filesFinished,  
    filesTotal,    
    percentCompleted: (filesFinished / filesTotal) * 100,
    filesPerSecond: filesFinished / ((Date.now() - startTime) / 1000),
    timeBetweenCalls,
    maxConcurrentUploads,                
  };
};
