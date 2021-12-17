import { DirectoryUploader } from "./directory-uploader";

import { promisify } from "util";
const timeout = promisify(setTimeout);

describe("Upload Directory", () => {
  describe("when created with a nftstorage client", () => {
    let uploader: DirectoryUploader;
    let client: any;
    beforeEach(() => {
      client = {
        store: jest.fn(),
      };
      uploader = new DirectoryUploader(client);
    });
    it("should exist", () => {
      expect(uploader).toBeDefined();
    });
    describe("when listening for file completed events", () => {
      let fileInfoFn;
      beforeEach(() => {
        fileInfoFn = jest.fn();
        uploader.on("file-completed", fileInfoFn);
      });
      describe("when uploading a directory", () => {
        let uploaded;
        let uploadPromise;
        beforeEach(() => {
          uploaded = jest.fn();
          uploadPromise = uploader.upload("./test/data").then(uploaded);
        });
        describe("when the store method resolves for each file", () => {
          beforeEach(() => {
            client.store.mockImplementation((req) => {
              switch (req.name) {
                case "test/data/1-file-directory/frankenstein.txt":
                  return Promise.resolve({
                    ipnft: "frankenstein-nft",
                    url: "frankenstein-url",
                  });
                case "test/data/4-nested/2-nested/deep-sibling-2.txt":
                  return Promise.resolve({
                    ipnft: "deep-sibling-2-nft",
                    url: "deep-sibling-2-url",
                  });
              }
              return Promise.resolve({});
            });
          });
          describe("when the upload promise resolves", () => {
            beforeEach(async () => {
              await uploadPromise;
            });
            it("should tell us the frankenstein file is complete, w/the nft info", () => {
              expect(fileInfoFn).toHaveBeenCalledWith(
                expect.objectContaining({
                  fileName: "test/data/1-file-directory/frankenstein.txt",
                  ipnft: "frankenstein-nft",
                  url: "frankenstein-url",
                }),
              );
            });
            it("should tell us the deep-sibling-2.txt file is complete, w/the nft info", () => {
              expect(fileInfoFn).toHaveBeenCalledWith(
                expect.objectContaining({
                  fileName: "test/data/4-nested/2-nested/deep-sibling-2.txt",
                  ipnft: "deep-sibling-2-nft",
                  url: "deep-sibling-2-url",
                }),
              );
            });
          });
        });
        describe("when the store method hasn't resolved all the promises yet", () => {
          let frankenPromise;
          let frankenResolve;
          beforeEach(async () => {
            frankenResolve = jest.fn();
            client.store.mockImplementation((req) => {
              if (req.name === "test/data/1-file-directory/frankenstein.txt") {
                frankenPromise = new Promise((resolve)=>{
                  frankenResolve = resolve;
                });                
                return frankenPromise;
              }
              return Promise.resolve({});
            });
            uploadPromise = uploader.upload("./test/data").then(uploaded);
            await timeout(10); //gotta get to the end of the event loop
          });
          it("should not have resolved the upload promise yet", () => {
            expect(uploaded).not.toHaveBeenCalled();
          });
          describe("when the store method resolves for the frankenstein file", () => {
            beforeEach(async () => {                  
              frankenResolve({})              
              await frankenPromise;                            
              await timeout(10); //gotta get to the end of the event loop
            });
            it("should tell us the frankenstein file is complete, w/the nft info", () => {
              expect(fileInfoFn).toHaveBeenCalledWith(
                expect.objectContaining({
                  fileName: "test/data/1-file-directory/frankenstein.txt",                 
                }),
              );
            });
          });
        });
      });
    });
  });
});
