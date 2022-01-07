import { getIpfsDirectoryInfo, findCidsForPaths } from "../lib/get-file-cids-from-folder"
import { create as ipfsHttpCreate } from "ipfs-http-client"
import { map, path } from "ramda"

// Note: to avoid rate limiting, consider running a local ipfs daemon and running the tests like this:
// IPFS_URL="http://localhost:5001/api/v0" npm run test
// This also caches the files locally, greatly speeding up the tests.

const IPFS_URL = process.env.IPFS_URL || "https://dweb.link/api/v0"

const getFileCount = (dir) => {
  return Object.keys(dir).length
}

const getFiles = map(path(["files"]))
const ls = (f) => {
  return map(ls, getFiles(f))
}

describe("Directory Walking in IPFS", () => {
  describe("getIpfsDirectoryInfo()", () => {
    it("should exist", () => {
      expect(getIpfsDirectoryInfo).toBeDefined()
    })
    describe("given an ipfs client", () => {
      let ipfs
      beforeAll(async () => {
        ipfs = ipfsHttpCreate(IPFS_URL)
        await ipfs.id
      })
      describe("given a known directory in ipfs", () => {
        let dirinfo

        beforeAll(async () => {
          const dirCid = "bafybeidl7ozkgaya4jb6tt3ey5t7pw7uefjfdirwfnnplrim2ksw7a4doi"
          dirinfo = await getIpfsDirectoryInfo(dirCid, ipfs)
        })

        it("should return an array with 1 folder", () => {
          const length = getFileCount(dirinfo)
          expect(length).toEqual(1)
        })

        it("should be a directory called 'data'", () => {
          const dir = dirinfo["data"]
          expect(dir.name).toEqual("data")
          expect(dir.type).toEqual("dir")
        })

        it("should have 4 files in it", () => {
          const dir = dirinfo["data"]
          const length = getFileCount(dir.files)

          expect(length).toEqual(4)
        })
        it("should have cids", () => {
          const cid = dirinfo["data"].cid
          expect(cid).toEqual("bafybeifoxdqsohqbyj7a7hzsh2aruusoal2yhbgustgw7e7zr4cc2ks7oa")
        })
      })
    })
  })
  describe("findCidsForPaths()", () => {
    let dirinfo
    describe("given a directory in the 'getIpfsDirectoryInfo' format", () => {
      beforeEach(() => {
        dirinfo = {
          "tower-madness": {
            cid: "tower-madness-cid",
            type: "dir",
            files: {
              "perilously.txt": {
                cid: "perilously-cid",
                type: "file",
                files: {},
              },
            },
          },
        }
      })
      describe("when flattening the directory", () => {
        let flattened
        beforeEach(() => {
          flattened = findCidsForPaths(dirinfo, ["tower-madness/perilously.txt"])
        })
        it("should give us the correct path for the perilously.txt file", () => {
          const perilous = flattened["tower-madness/perilously.txt"]
          expect(perilous.cid).toEqual("perilously-cid")
        })
      })
    })
    describe("given a different directory in the 'getIpfsDirectoryInfo' format", () => {
      beforeEach(() => {
        dirinfo = {
          "flips-stealth": {
            cid: "flips-stealth-cid",
            type: "dir",
            files: {
              "melodramatic-malfunctions": {
                cid: "melodramatic-malfunctions-cid",
                type: "dir",
                files: {
                  "urges-fingerprint-gradually.txt": {
                    cid: "gradual-fingerprint-cid",
                    type: "file",
                    files: {},
                  },
                },
              },
            },
          },
        }
      })
      describe("when flattening the directory with different input", () => {
        let flattened
        beforeEach(() => {
          flattened = findCidsForPaths(dirinfo, ["flips-stealth/melodramatic-malfunctions/urges-fingerprint-gradually.txt"])
        })
        it("should give us the correct path for the urges-fingerprint-gradually.txt file", () => {
          const sudden = flattened["flips-stealth/melodramatic-malfunctions/urges-fingerprint-gradually.txt"]
          expect(sudden.cid).toEqual("gradual-fingerprint-cid")
        })
      })
    })
  })
})
