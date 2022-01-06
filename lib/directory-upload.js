export const directoryUpload = async (directory) => {
  return [];
};

export const getIpfsDirectoryInfo = async (directory, ipfsClient) => {
  console.log("getIpfsDirectoryInfo: directory:", directory);
  const links = new Map();
  const thingsToWaitFor = [];
  for await (const l of ipfsClient.ls(directory)) {
    const link = {...l, files: new Map()};
    links.set(link.cid, link);
    
    if (!link.type === "dir" || !link.name) {
      continue;
    }

    thingsToWaitFor.push(
      getIpfsDirectoryInfo(link.cid.toString(), ipfsClient).then((sublinks) => {
        link.files = new Set([...sublinks, ...link.files]);
        console.log("getIpfsDirectoryInfo: link.files:", link.files);
      }),
    );
  }
  await Promise.all(thingsToWaitFor)
  return links;
};
