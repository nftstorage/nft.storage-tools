export const directoryUpload = async (directory) => {
  return [];
};

export const getIpfsDirectoryInfo = async (directory, ipfsClient) => {
  console.log("getIpfsDirectoryInfo: directory:", directory);
  const links = new Map();
  const thingsToWaitFor = [];
  for await (const l of ipfsClient.ls(directory)) {
    console.log("working on", l.name);
    if (l.type !== "dir" || l.name === undefined) {     
      continue;
    }
    const link = { ...l };
    links.set(link.name, link);

    console.log({link, links})
    link.files = new Map();

    thingsToWaitFor.push(
      getIpfsDirectoryInfo(link.cid.toString(), ipfsClient).then((sublinks) => {
        console.log("traversing sublinks:", sublinks);
        link.files = new Set([...sublinks, ...link.files]);
        console.log("finished", link.name);
      }),
    );
  }
  await Promise.all(thingsToWaitFor);
  console.log({links});
  return links;
};
