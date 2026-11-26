import * as express from 'express'

/*
 * HTTP caching for the full pictogram catalog (GET/HEAD /pictograms/all/{language}).
 *
 * Before running the big find() (~6.9 MB per language) we run a cheap query that gives
 * { count, maxLastUpdated } of the published pictograms:
 *  - maxLastUpdated changes on any insert, edit or (re)publication (private-api sets lastUpdated).
 *  - count changes when a pictogram is unpublished or deleted (maxLastUpdated would not).
 * Both build a weak ETag (body order is not guaranteed and it may be gzipped), and
 * maxLastUpdated is the Last-Modified. If the client copy is fresh we answer 304 without
 * reading or serializing the collection.
 *
 * Recommended index on every pictos_{language} collection:
 *   db.pictos_xx.createIndex({ published: 1, lastUpdated: -1 })
 */

export const PUBLIC_CATALOG_CACHE = 'public, max-age=3600, stale-while-revalidate=86400'
// v2 responses are authenticated: never let shared caches store them
export const PRIVATE_CATALOG_CACHE = 'private, max-age=3600, stale-while-revalidate=86400'

export interface CatalogMeta {
  count: number
  maxLastUpdated?: Date
}

const PUBLISHED = { published: true }

export const getCatalogMeta = async (model: any): Promise<CatalogMeta> => {
  const [count, latest] = await Promise.all([
    model.countDocuments(PUBLISHED),
    model.findOne(PUBLISHED, { lastUpdated: 1, _id: 0 }).sort({ lastUpdated: -1 }).lean(),
  ])
  const maxLastUpdated = latest?.lastUpdated ? new Date(latest.lastUpdated) : undefined
  return { count, maxLastUpdated }
}

export const catalogETag = ({ count, maxLastUpdated }: CatalogMeta): string =>
  `W/"${count}-${maxLastUpdated ? maxLastUpdated.getTime() : 0}"`

export const setCatalogHeaders = (res: express.Response, meta: CatalogMeta, cacheControl: string): void => {
  res.set('ETag', catalogETag(meta))
  // toUTCString() truncates to seconds, the precision HTTP dates have; req.fresh compares on that
  if (meta.maxLastUpdated) res.set('Last-Modified', meta.maxLastUpdated.toUTCString())
  res.set('Cache-Control', cacheControl)
}

export const clearCatalogHeaders = (res: express.Response): void => {
  res.removeHeader('ETag')
  res.removeHeader('Last-Modified')
  res.set('Cache-Control', 'no-store')
}

/*
 * Shared flow for GET and HEAD. `find` is only called when a 200 with body must be sent.
 */
export const sendCatalog = async (
  req: express.Request,
  res: express.Response,
  model: any,
  find: () => Promise<unknown>,
  cacheControl: string,
): Promise<express.Response | void> => {
  const meta = await getCatalogMeta(model)
  setCatalogHeaders(res, meta, cacheControl)
  // req.fresh handles If-None-Match (weak comparison, takes precedence) and If-Modified-Since
  if (req.fresh) return res.status(304).end()
  if (req.method === 'HEAD') return res.type('json').end()
  const data = await find()
  return res.json(data)
}
