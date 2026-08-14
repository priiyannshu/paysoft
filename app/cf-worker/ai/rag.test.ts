import { describe, it, expect } from 'vitest'
import { retrieveComplianceContext, streamChatResponse } from './rag'

describe('PaySoft AI & Vectorize RAG Engine', () => {
  it('retrieves accurate compliance chunks for standard deduction query', async () => {
    const results = await retrieveComplianceContext(
      'What is the standard deduction in the new tax regime for FY 2025-26?',
      {},
      3
    )

    expect(results.length).toBeGreaterThan(0)
    const combinedText = results.map((r) => r.text).join(' ')
    expect(combinedText).toContain('75,000')
    expect(combinedText).toContain('New Tax Regime')
  })

  it('retrieves EPFO wage ceiling and 12% contribution rules', async () => {
    const results = await retrieveComplianceContext(
      'How is EPF calculated and why is it capped at 1800?',
      {},
      3
    )

    expect(results.length).toBeGreaterThan(0)
    const combinedText = results.map((r) => r.text).join(' ')
    expect(combinedText).toContain('12%')
    expect(combinedText).toContain('15,000')
  })

  it('streams statutory response over Server-Sent Events (SSE)', async () => {
    const response = await streamChatResponse(
      'What is the standard deduction in the new tax regime for FY 2025-26?',
      [],
      {}
    )

    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(response.body).toBeDefined()

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let accumulatedText = ''
    let receivedDone = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: [DONE]')) {
          receivedDone = true
        } else if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.substring(6))
            if (parsed.response) {
              accumulatedText += parsed.response
            }
          } catch {
            // non-json line
          }
        }
      }
    }

    expect(receivedDone).toBe(true)
    expect(accumulatedText).toContain('75,000')
    expect(accumulatedText.toLowerCase()).toContain('standard deduction')
  })

  it('streams accurate HRA least-of-three calculation breakdown', async () => {
    const response = await streamChatResponse(
      'Explain how HRA exemption is calculated under Section 10(13A)',
      [],
      {}
    )

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let accumulatedText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      accumulatedText += decoder.decode(value)
    }

    expect(accumulatedText).toContain('10(13A)')
    expect(accumulatedText).toContain('HRA')
  })
})
