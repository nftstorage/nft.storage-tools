# nft.storage tools

Tools for working with nft.storage.

## Usage

1. Install dependencies `npm install`
1. Add a `.env` file to the project root and add the following content:

```sh
ENDPOINT="https://api.nft.storage"
API_KEY="NFT_STORAGE_API_KEY"
```

For `cluster*.js` scripts, add:

```sh
CLUSTER_URL="https://nft.storage.ipfscluster.io/api/"
CLUSTER_HEADERS='{"Authorization":"Basic CLUSTER_BASIC_AUTH_KEY"}'
```
