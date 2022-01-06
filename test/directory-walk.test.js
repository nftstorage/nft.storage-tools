import { getIpfsDirectoryInfo } from "../lib/directory-upload.js";
import { create } from "ipfs-http-client";

const IPFS_URL = process.env.IPFS_URL || "https://dweb.link/api/v0`";
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
        const node_modules_cid = "bafybeigda2iqw3zmzigxdv65hrrarwwnb3ysgbh4r6xkk6vl4hhtj7k3xi";
        dirinfo = await getIpfsDirectoryInfo(node_modules_cid, ipfs);
      });
      it("should return an array with 1 folder", () => {
        expect(dirinfo).toHaveLength(1);
      });
      it("should be a  directory with the right name", () => {
        const [dir] = dirinfo
        expect(dir.name).toEqual("node_modules");
        expect(dir.type).toEqual("directory");
      });
    });
  });
});
