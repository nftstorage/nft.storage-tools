/**
 * Get and print the status of a single CID.
 *
 * Usage:
 *     node single-status.js bafybeia4eil5y73ooy3e7mhyk5dvcaml3ket64q6f6u5z4ozbxctw53r6i
 */
import dotenv from 'dotenv'
import { NFTStorage } from 'nft.storage'

dotenv.config()

async function main () {
  if (!process.env.API_KEY) {
    throw new Error('missing nft.storage API key')
  }

  const cid = process.argv[2]
  if (!cid) {
    throw new Error('missing CID argument')
  }

  const endpoint = process.env.ENDPOINT || 'https://api.nft.storage'
  console.log(`🔌 Using endpoint: ${endpoint}`)

  const store = new NFTStorage({ token: process.env.API_KEY, endpoint })
  console.log(await store.status(cid))
}

main()
