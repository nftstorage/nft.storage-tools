/**
 * List all files in your nft.storage account.
 *
 * Usage:
 *     node files-list.js
 */
import dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config()

async function * list (endpoint) {
  let before = ''
  while (true) {
    const url = new URL(`?before=${before}&limit=100`, endpoint)
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${process.env.API_KEY}` }
    })
    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText}: ${await res.text()}`)
    }
    const { value } = await res.json()
    yield value
    if (!value.length) break
    before = value[value.length - 1].created
  }
}

async function main () {
  if (!process.env.API_KEY) {
    throw new Error('missing nft.storage API key')
  }

  const endpoint = process.env.ENDPOINT || 'https://api.nft.storage'
  console.log(`🔌 Using endpoint: ${endpoint}`)

  for await (const nfts of list(endpoint)) {
    for (const nft of nfts) {
      console.log(`${nft.created} ${nft.cid} ${nft.pin.status}`)
    }
  }
}

main()
