// src/utils/aiAgent.ts
import OpenAI from 'openai'
import { OPENAI_API_KEY } from './env'

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
})

export async function analyzeJob(jobText: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-nano',
    messages: [
      {
        role: 'system',
        content: process.env.PROMPT ?? ''
      },
      {
        role: 'user',
        content: jobText
      }
    ]
  })

  return response.choices[0].message?.content ?? ''
}
