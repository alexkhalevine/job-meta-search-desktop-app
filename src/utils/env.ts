// src/utils/env.ts
import dotenv from 'dotenv'
dotenv.config()

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!
export const LOCATION = process.env.LOCATION!
