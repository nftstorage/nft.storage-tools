export default async function * drop (source, n) {
  let i = 0
  for await (const item of source) {
    i++
    if (i < n) continue
    yield item
  }
}
