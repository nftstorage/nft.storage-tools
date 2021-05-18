# nft.storage tools

Tools for working with nft.storage.

## Usage

1. Ensure [git](https://git-scm.com/) and [Node.js](https://nodejs.org) are installed.
1. Clone this repo:
    ```sh
    git clone https://github.com/nftstorage/nft.storage-tools.git
    cd nft.storage-tools
    ```
1. Install dependencies:
    ```sh
    npm install
    ```
1. Sign up for an account on [nft.storage](https://nft.storage) and create an API key.
1. Create a `.env` file in the project root and add the following content:
    ```sh
    ENDPOINT="https://api.nft.storage"
    API_KEY="NFT_STORAGE_API_KEY"
    ```
1. Choose a script from the root to run (usage instructions can be found at the top of the file) or instructions for some common [tasks](#tasks) can be found below.

### Advanced (nft.storage developers only)

To talk directly to the nft.storage IPFS Cluster using the `cluster*.js` scripts, add the following to the `.env` file:

```sh
CLUSTER_URL="https://CLUSTER_DOMAIN/api/"
CLUSTER_HEADERS='{"Authorization":"Basic CLUSTER_BASIC_AUTH_KEY"}'
```

## Tasks

### Import a list of CIDs

You have a list of CIDs for content you have stored in IPFS already and would like to import that content into nft.storage.

1. Export CIDs to a newline delimited file. For example, you could use the following command:
    ```sh
    ipfs pin ls -q > pinlist.txt
    ```
1. Follow the [usage instructions](#usage) above until the last step.
1. Run the import script:
    ```sh
    node import.js pinlist.txt
    ```
    Note: if you need to stop the script, you can resume from a particular line number by passing `--start 1000` (to start from line 1,000).

After nft.storage receives all your CIDs, it'll start to transfer data from peers that already have the content. This may take a long time for long lists of CIDs and may _fail_ if the content cannot be found on the IPFS network. You can [check the status of the CIDs you imported](#check-pinning-status-of-cid-list).

### Check pinning status of CID list

You have previously imported a CID list and want to check to see progress of the pinning operations.

1. Follow instructions for [importing a list of CIDs](#import-a-list-of-cids).
1. Run the status checker script:
    ```sh
    node status.js pinlist.txt
    ```
    Note: failed and unknown CIDs are shown after all CIDs have been queried. These can be re-imported to attempt recovery.

## Contributing

Feel free to join in. All welcome. [Open an issue](https://github.com/nftstorage/nft.storage-tools/issues)!

## License

Dual-licensed under [MIT](https://github.com/nftstorage/nft.storage-tools/blob/main/LICENSE-MIT) + [Apache 2.0](https://github.com/nftstorage/nft.storage-tools/blob/main/LICENSE-APACHE)