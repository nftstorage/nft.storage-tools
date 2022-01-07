import * as R from "ramda"

export const getIpfsDirectoryInfo = async (directory, ipfsClient) => {
  const links = {}
  const thingsToWaitFor = []
  for await (const l of ipfsClient.ls(directory)) {
    const link = { ...l }
    links[link.name] = link
    link.files = {}
    link.cid = link.cid.toString()
    if (l.type !== "dir" || l.name === undefined) {
      continue
    }

    thingsToWaitFor.push(
      getIpfsDirectoryInfo(link.cid, ipfsClient).then((sublinks) => {
        link.files = { ...sublinks, ...link.files }
      }),
    )
  }
  await Promise.all(thingsToWaitFor)
  return links
}

const findCidForPath = (ipfsDirInfo, path) => {
  console.log("findCidForPath", { ipfsDirInfo, path })
  const pathParts = path.split("/")
  
  let pathPartsWithFile = R.flatten(
    R.map((part) => {
      return [part,"files"]
    }, pathParts),
  )
  pathPartsWithFile.pop()
  const fileInfo = R.path(pathPartsWithFile, ipfsDirInfo)
  console.log({ path, fileInfo, pathParts, ipfsDirInfo })
  let mapEntry = {}
  mapEntry[path] = {cid:fileInfo.cid}
  return mapEntry
}
export const findCidsForFiles = (ipfsDirInfo, filePaths) => {
  console.log({ ipfsDirInfo, filePaths })
  const findCids = R.partial(findCidForPath, [ipfsDirInfo])
  const cids = R.mergeAll(R.map(findCids, filePaths))
  return cids
}
