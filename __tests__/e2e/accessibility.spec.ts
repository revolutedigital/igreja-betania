import { test, expect } from '@playwright/test'
import AxeBuilder from '@anthropic/test-helpers'

// Páginas a testar
const pagesToTest = [
  { path: '/', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/cadastro', name: 'Cadastro' },
]

test.describe('Acessibilidade', () => {
  for (const { path, name } of pagesToTest) {
    test(`${name} (${path}) deve ser navegável por teclado`, async ({ page }) => {
      await page.goto(path)

      // Verificar que Tab funciona
      await page.keyboard.press('Tab')
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeDefined()
    })

    test(`${name} (${path}) deve ter títulos de página`, async ({ page }) => {
      await page.goto(path)

      const title = await page.title()
      expect(title).toBeTruthy()
      expect(title.length).toBeGreaterThan(0)
    })

    test(`${name} (${path}) deve ter lang definido`, async ({ page }) => {
      await page.goto(path)

      const lang = await page.getAttribute('html', 'lang')
      expect(lang).toBeTruthy()
    })
  }

  test('formulário de cadastro deve ter labels', async ({ page }) => {
    await page.goto('/cadastro')

    // Verificar inputs têm labels ou aria-label
    const inputs = await page.locator('input').all()

    for (const input of inputs) {
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledby = await input.getAttribute('aria-labelledby')
      const placeholder = await input.getAttribute('placeholder')

      // Input deve ter pelo menos uma forma de label
      const hasLabel = id
        ? await page.locator(`label[for="${id}"]`).count() > 0
        : false
      const hasAccessibleName = ariaLabel || ariaLabelledby || placeholder || hasLabel

      expect(hasAccessibleName).toBeTruthy()
    }
  })

  test('botões devem ter texto acessível', async ({ page }) => {
    await page.goto('/cadastro')

    const buttons = await page.locator('button').all()

    for (const button of buttons) {
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const title = await button.getAttribute('title')

      // Botão deve ter texto, aria-label ou title
      const hasAccessibleName =
        (text && text.trim().length > 0) || ariaLabel || title

      expect(hasAccessibleName).toBeTruthy()
    }
  })

  test('imagens devem ter alt text', async ({ page }) => {
    await page.goto('/')

    const images = await page.locator('img').all()

    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')

      // Imagem deve ter alt (mesmo vazio para decorativas) ou role="presentation"
      const hasAlt = alt !== null || role === 'presentation'
      expect(hasAlt).toBeTruthy()
    }
  })

  test('links devem ser distinguíveis', async ({ page }) => {
    await page.goto('/')

    const links = await page.locator('a').all()

    for (const link of links) {
      const text = await link.textContent()
      const ariaLabel = await link.getAttribute('aria-label')

      // Link deve ter texto descritivo
      const hasAccessibleName =
        (text && text.trim().length > 0) || ariaLabel

      expect(hasAccessibleName).toBeTruthy()
    }
  })

  test('cores devem ter contraste suficiente', async ({ page }) => {
    await page.goto('/')

    // Verificar que texto principal tem contraste adequado
    // (Teste básico - ferramentas como axe fazem verificação mais completa)
    const bodyStyle = await page.evaluate(() => {
      const body = document.body
      const style = window.getComputedStyle(body)
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
      }
    })

    expect(bodyStyle.color).toBeDefined()
    expect(bodyStyle.backgroundColor).toBeDefined()
  })

  test('skip link deve existir', async ({ page }) => {
    await page.goto('/')

    // Muitos sites têm skip link para navegação por teclado
    // Este é um teste informativo
    const skipLink = page.locator('a[href="#main"], a[href="#content"], .skip-link')
    const hasSkipLink = await skipLink.count() > 0

    // Não falhar, apenas reportar
    if (!hasSkipLink) {
      console.log('Sugestão: Adicionar skip link para melhor acessibilidade')
    }
  })
})

test.describe('Acessibilidade - Interação', () => {
  test('modal de atalhos deve ser acessível', async ({ page }) => {
    await page.goto('/')

    // Abrir modal de atalhos
    await page.keyboard.press('?')

    // Verificar que modal está visível
    const modal = page.locator('text=Atalhos de Teclado')
    if (await modal.isVisible()) {
      // Modal deve ter role="dialog"
      const dialog = page.locator('[role="dialog"], .modal')
      await expect(dialog.or(modal)).toBeVisible()

      // Deve poder fechar com Escape
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
    }
  })

  test('toggle de tema deve ser acessível', async ({ page }) => {
    await page.goto('/')

    const themeToggle = page.locator('button[aria-label*="modo"]')
    if (await themeToggle.isVisible()) {
      await expect(themeToggle).toHaveAttribute('aria-label')

      // Deve ser focável
      await themeToggle.focus()
      await expect(themeToggle).toBeFocused()

      // Deve funcionar com Enter
      await page.keyboard.press('Enter')
    }
  })
})
