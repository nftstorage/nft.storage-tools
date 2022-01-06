import { getIpfsDirectoryInfo } from "../lib/directory-upload.js";
import { create } from "ipfs-http-client";

const IPFS_URL = process.env.IPFS_URL || "https://dweb.link/api/v0";
describe("Directory Walking in IPFS", () => {
  describe("directoryWalk", () => {
    it("should exist", () => {
      expect(getIpfsDirectoryInfo).toBeDefined();
    });
  });
  describe("given an ipfs client", () => {
    let ipfs;
    beforeEach(() => {
      ipfs = create(IPFS_URL);
    });
    describe("given a known directory in ipfs (containing the node_modules of this project, as a matter of fact)", () => {
      let dirinfo;
      
      beforeEach(async () => {
        const node_modules_cid = "bafybeihf7w7ypovwsbfharafaxbsgrc4qtvgrpueqriv4mvtshklsngu5e";
        dirinfo = await getIpfsDirectoryInfo(node_modules_cid, ipfs);
      });

      it.only("should return an array with 1 folder", () => {
        expect(dirinfo.size).toEqual(1);
      });

      it("should be a directory called 'node_modules'", () => {
        const dir = dirinfo.get('node_modules');
        expect(dir.name).toEqual("node_modules");
        expect(dir.type).toEqual("dir");
      });
      it("should have the correct number of files", () => {
        const dir = dirinfo.get('node_modules');
        expect(dir.files.size).toEqual(3);
      })
    });
    describe("given a different directory in ipfs", () => {
      let dirinfo;
      
      beforeEach(async () => {
        const jest_module_cid = "bafybeiam7xjs4jhpfegy5z7ob5a4ad2lifj53minvaobelhhsx7ksq6wwa";
        dirinfo = await getIpfsDirectoryInfo(jest_module_cid, ipfs);
      });

      it("should return an array with 11 folders", () => {
        expect(dirinfo.size).toEqual(11);
      });

      it("should have a directory named 'console'", () => {
        const dir = dirinfo.get('console');
        expect(dir.name).toEqual("console");
        expect(dir.type).toEqual("dir");
      });
      
    });
  });
});
