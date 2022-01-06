export const directoryUpload = async (directory) => {
  return []
}

export const getIpfsDirectoryInfo = async (directory, ipfsClient) => {  
    const links = new Map()
    for await (const link of ipfsClient.ls(directory)) {
      links.set(link.name, link)
    }
  return links
}