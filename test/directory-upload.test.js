import {mkdirSync} from "fs"
import { directoryUpload } from "../lib/directory-upload.js"
describe("Directory Uploading", () => {
  describe("directoryUpload", () => {
    it("should exist", () => {
      expect(directoryUpload).toBeDefined()
    })
    describe("given a directory with no files", () => {
      beforeEach(() => {
        try {
          //Unfortunately, you can't commit an empty directory to git.
          mkdirSync("./test/data/empty-directory")
        }
        catch(e){}
      })
      it("should return an empty array", async () => {
        const results = await directoryUpload("./test/data/empty-directory")
        expect(results).toEqual([])
      })
    })
    describe("given a directory with 1 file", () => {
      let results
      beforeEach(async () => {
        results = await directoryUpload("./test/data/1-file-directory")
      })

      it("should return an array with 1 element", () => {        
        expect(results).toHaveLength(1)
      })
      it("should return an array with the correct file path and cid", () => {
        const {cid} = results["frankenstein.txt"]
        expect(cid).toEqual("QmUssLAvSqa48bukYXjnqyeWpYjKjewo7Ruyd8SrmW6tVz")
      })
    })
  })
})