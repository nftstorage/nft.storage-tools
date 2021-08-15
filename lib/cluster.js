export function toPSAStatus (status) {
  const pinInfos = Object.values(status.peerMap)
  if (pinInfos.some((i) => i.status === 'pinned')) return 'pinned'
  if (pinInfos.some((i) => i.status === 'pinning')) return 'pinning'
  if (pinInfos.some((i) => i.status === 'pin_queued')) return 'queued'
  return 'failed'
}
