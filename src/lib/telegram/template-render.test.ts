import { describe, expect, it } from 'vitest'
import { escapeTelegramMarkdown, renderTelegramTemplate } from '@/lib/telegram/template-render'

describe('renderTelegramTemplate', () => {
  it('replaces all placeholders', () => {
    const out = renderTelegramTemplate('Halo {{nama}} — {{harga}}', {
      nama: 'Budi',
      harga: 'Rp 10.000',
    })
    expect(out).toBe('Halo Budi — Rp 10.000')
  })

  it('uses empty string for missing values', () => {
    const out = renderTelegramTemplate('{{a}}-{{b}}', { a: 'x' })
    expect(out).toBe('x-')
  })

  it('escapes markdown in dynamic values', () => {
    const out = renderTelegramTemplate('{{nama}}', { nama: 'test_name' })
    expect(out).toBe('test\\_name')
  })

  it('wraps link placeholders as clickable markdown links', () => {
    const out = renderTelegramTemplate('👉 {{linkProduk}}', {
      linkProduk: 'https://bantoo.in/marketplace/abc',
    })
    expect(out).toBe('👉 [LINK PRODUK](https://bantoo.in/marketplace/abc)')
  })
})

describe('escapeTelegramMarkdown', () => {
  it('escapes special characters', () => {
    expect(escapeTelegramMarkdown('*bold* `_`')).toBe('\\*bold\\* \\`\\_\\`')
  })
})
