import { Schema, model, Document } from 'mongoose'
export interface IKeyword {
  language: string
  words: string[]
  updated?: Date
}

export interface IntKeyword extends Document, IKeyword {}

const keywordSchema = new Schema<IntKeyword>(
  {
    language: { type: String, required: true },
    words: [String],
    updated: { type: Date, default: Date.now },
  },
  { collection: 'keywords' },
)

export const Keyword = model<IntKeyword>('Keyword', keywordSchema)

export default Keyword
