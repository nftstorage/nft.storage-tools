export const directoryUpload = async (directory) => {
  return []
}

export const getIpfsDirectoryInfo = async (directory, ipfsClient) => {
  const links = {}
  const thingsToWaitFor = []
  for await (const l of ipfsClient.ls(directory)) {
    if (l.type !== "dir" || l.name === undefined) {     
      continue
    }
    const link = { ...l }
    links[link.name] =  link
    link.files = {}

    thingsToWaitFor.push(
      getIpfsDirectoryInfo(link.cid.toString(), ipfsClient).then((sublinks) => {
        link.files = {...sublinks, ...link.files}
      }),
    )
  }
  await Promise.all(thingsToWaitFor)
  return links
}
