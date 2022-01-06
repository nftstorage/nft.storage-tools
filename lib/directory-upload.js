export const directoryUpload = async (directory) => {
  return [];
};

export const getIpfsDirectoryInfo = async (directory, ipfsClient) => {
  console.log("getIpfsDirectoryInfo: directory:", directory);
  const links = new Map();
  const thingsToWaitFor = [];
  for await (const link of ipfsClient.ls(directory)) {

    //Let this be a warning: we can't use sets.
    links.set(link.name, link);
    console.log("add link:", link);
    if (!link.type === "dir") {
      link.files.set(link.name, link);
      continue;
    }
    thingsToWaitFor.push(
      getIpfsDirectoryInfo(link.cid.toString(), ipfsClient).then((sublinks) => {
        link.files = new Set([...sublinks, ...link.files]);
      }),
    );
  }
  await Promise.all(thingsToWaitFor)
  return links;
};
