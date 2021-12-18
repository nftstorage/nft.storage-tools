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
  })
})