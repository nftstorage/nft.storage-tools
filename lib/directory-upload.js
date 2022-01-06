export const directoryUpload = async (directory) => {
  return []
}

export const getIpfsDirectoryInfo = async (directory, ipfsClient) => { 
  console.log("getIpfsDirectoryInfo: directory:", directory)
    const links = new Map()
    for await (const link of ipfsClient.ls(directory)) {
      links.set(link.name, link)
      console.log("add link:", link.name)
      if(link.type === 'dir') {       
        const sublinks = getIpfsDirectoryInfo(link.cid.toString(), ipfsClient)
        link.files = sublinks
        console.log({sublinks})
      }        
    }
  return links
}