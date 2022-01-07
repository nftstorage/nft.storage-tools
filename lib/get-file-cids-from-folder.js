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
  console.log({ pathParts })
  let pathPartsWithFile = R.flatten(
    R.map((part) => {
      return [part,"files"]
    }, pathParts),
  )
  pathPartsWithFile.pop()
  console.log({ pathPartsWithFile })
  const cid = R.path(pathParts, ipfsDirInfo)
  console.log({ path, cid, pathParts, ipfsDirInfo })
  return R.flatten([cid, "files"])
}
export const findCidsForFiles = (ipfsDirInfo, filePaths) => {
  console.log({ ipfsDirInfo, filePaths })
  const findCids = R.partial(findCidForPath, [ipfsDirInfo])
  const cids = R.map(findCids, filePaths)
  return cids
}
