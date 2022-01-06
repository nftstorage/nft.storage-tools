export const directoryUpload = async (directory) => {
  return []
}

export const getIpfsDirectoryInfo = async (directory, ipfsClient) => {  
    const links = []
    for await (const link of ipfsClient.ls(directory)) {
      links.push(link)
    }
  return links
}