// src/utils/env.ts
import * as dotenv from 'dotenv'
dotenv.config()

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!
export const LOCATION = process.env.LOCATION!

export function getLocation(): string {
  return process.env.LOCATION || ''
}
