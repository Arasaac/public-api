import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'

export async function seedDatabase(): Promise<void> {
  const fixturesDir = path.resolve(__dirname, 'fixtures')

  // 1. Seed pictos_es
  const esFile = path.join(fixturesDir, 'pictos_es.json')
  if (fs.existsSync(esFile)) {
    const raw = JSON.parse(fs.readFileSync(esFile, 'utf8'))
    const docs = raw.map((item: any) => ({
      ...item,
      created: item.created ? new Date(item.created) : new Date(),
      lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
    }))
    const col = mongoose.connection.collection('pictos_es')
    await col.deleteMany({})
    if (docs.length > 0) {
      await col.insertMany(docs)
    }
    await col.createIndex({ "keywords.keyword": "text", tags: "text" }, { weights: { "keywords.keyword": 10, tags: 1 }, default_language: "none", language_override: "language" })
  }

  // 2. Seed pictos_en
  const enFile = path.join(fixturesDir, 'pictos_en.json')
  if (fs.existsSync(enFile)) {
    const raw = JSON.parse(fs.readFileSync(enFile, 'utf8'))
    const docs = raw.map((item: any) => ({
      ...item,
      created: item.created ? new Date(item.created) : new Date(),
      lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
    }))
    const col = mongoose.connection.collection('pictos_en')
    await col.deleteMany({})
    if (docs.length > 0) {
      await col.insertMany(docs)
    }
    await col.createIndex({ "keywords.keyword": "text", tags: "text" }, { weights: { "keywords.keyword": 10, tags: 1 }, default_language: "none", language_override: "language" })
  }

  // 3. Seed materials
  const matFile = path.join(fixturesDir, 'materials.json')
  if (fs.existsSync(matFile)) {
    const raw = JSON.parse(fs.readFileSync(matFile, 'utf8'))
    const docs = raw.map((item: any) => ({
      ...item,
      _id: mongoose.isValidObjectId(item._id) ? (new (mongoose.Types.ObjectId as any)(item._id)) : item._id,
      created: item.created ? new Date(item.created) : new Date(),
      lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
      translations: (item.translations || []).map((t: any) => ({
        ...t,
        created: t.created ? new Date(t.created) : new Date(),
        lastUpdated: t.lastUpdated ? new Date(t.lastUpdated) : new Date(),
        authors: (t.authors || []).map((a: any) => ({
          ...a,
          author: a.author && mongoose.isValidObjectId(a.author) ? (new (mongoose.Types.ObjectId as any)(a.author)) : a.author,
        })),
      })),
      authors: (item.authors || []).map((a: any) => ({
        ...a,
        author: a.author && mongoose.isValidObjectId(a.author) ? (new (mongoose.Types.ObjectId as any)(a.author)) : a.author,
      })),
    }))
    const col = mongoose.connection.collection('materials')
    await col.deleteMany({})
    if (docs.length > 0) {
      await col.insertMany(docs)
    }
    await col.createIndex({ "translations.title": "text", "translations.desc": "text" }, { weights: { "translations.desc": 1, "translations.title": 30 }, default_language: "spanish", language_override: "language" })
  }

  // 4. Seed synsets
  const synFile = path.join(fixturesDir, 'synsets.json')
  if (fs.existsSync(synFile)) {
    const raw = JSON.parse(fs.readFileSync(synFile, 'utf8'))
    const col = mongoose.connection.collection('synsets')
    await col.deleteMany({})
    if (raw.length > 0) {
      await col.insertMany(raw)
    }
  }

  // 5. Seed keywords
  const kwFile = path.join(fixturesDir, 'keywords.json')
  if (fs.existsSync(kwFile)) {
    const raw = JSON.parse(fs.readFileSync(kwFile, 'utf8'))
    const docs = raw.map((item: any) => ({
      ...item,
      _id: mongoose.isValidObjectId(item._id) ? (new (mongoose.Types.ObjectId as any)(item._id)) : item._id,
    }))
    const col = mongoose.connection.collection('keywords')
    await col.deleteMany({})
    if (docs.length > 0) {
      await col.insertMany(docs)
    }
  }
}

export async function clearDatabase(): Promise<void> {
  const collections = ['pictos_es', 'pictos_en', 'materials', 'synsets', 'keywords']
  for (const name of collections) {
    try {
      await mongoose.connection.collection(name).deleteMany({})
    } catch (_) {}
  }
}
