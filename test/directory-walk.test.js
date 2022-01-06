import { getIpfsDirectoryInfo } from "../lib/directory-upload.js"
import { create as ipfsHttpCreate } from "ipfs-http-client"
import { map, path } from "ramda"

// Note: to avoid rate limiting, consider running a local ipfs daemon and running the tests like this:
// IPFS_URL="http://localhost:5001/api/v0" npm run test 
// This also caches the files locally, greatly speeding up the tests.

const IPFS_URL = process.env.IPFS_URL || "https://dweb.link/api/v0"

const getFileCount = (dir) => {
  return Object.keys(dir).length
}

const getFiles = map(
  path(["files"])
)
const ls  = (f)=>{
  return map(ls, getFiles(f))  
}

describe("Directory Walking in IPFS", () => {
  describe("directoryWalk", () => {
    it("should exist", () => {
      expect(getIpfsDirectoryInfo).toBeDefined()
    })
  })
  describe("given an ipfs client", () => {
    let ipfs
    beforeAll(async () => {
      ipfs = ipfsHttpCreate(IPFS_URL)
      await ipfs.id
    })
    describe("given a known directory in ipfs (containing the node_modules of this project, as a matter of fact)", () => {
      let dirinfo

      beforeAll(async () => {
        const node_modules_cid = "bafybeidl7ozkgaya4jb6tt3ey5t7pw7uefjfdirwfnnplrim2ksw7a4doi"
        dirinfo = await getIpfsDirectoryInfo(node_modules_cid, ipfs)
        // console.log(JSON.stringify(dirinfo, null, 2))
        console.log(JSON.stringify(ls(dirinfo),null, 2))
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
    })
    xdescribe("given a different directory in ipfs", () => {
      let dirinfo

      beforeEach(async () => {
        const jest_module_cid = "bafybeiam7xjs4jhpfegy5z7ob5a4ad2lifj53minvaobelhhsx7ksq6wwa"
        dirinfo = await getIpfsDirectoryInfo(jest_module_cid, ipfs)
      })

      it("should return an array with 11 folders", () => {
        const length = getFileCount(dir)
        expect(length).toEqual(11)
      })

      it("should have a directory named 'console'", () => {
        const dir = dirinfo.get("console")
        expect(dir.name).toEqual("console")
        expect(dir.type).toEqual("dir")
      })
    })
  })
})
