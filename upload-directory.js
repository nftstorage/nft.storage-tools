#!/usr/bin/env node
/**
 * Upload all files in a directory. Recursively searches subdirectories and uploads async.
 *
 * Usage:
 *     MAX_CONCURRENT_UPLOADS=5 API_KEY="<whatever>" node upload-directory.js ./test/data/1-file-directory

 */
import {uploadDirectory} from './lib/upload-directory.js';
import dotenv from "dotenv";

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
  const maxTimeout = process.env.MAX_TIMEOUT || 60 * 1000;
  const maxConcurrentUploads = parseInt(process.env.MAX_CONCURRENT_UPLOADS || '10');
  await uploadDirectory({ endpoint, token, path: filePath, maxConcurrentUploads, maxTimeout });
}

main();
