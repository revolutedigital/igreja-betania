import { test, expect } from '@playwright/test'

test.describe('Fluxo: Cadastro de Membro', () => {
  test('deve carregar a página de cadastro', async ({ page }) => {
    await page.goto('/cadastro')

    await expect(page.locator('h1')).toContainText('Cadastro')
    await expect(page.locator('input[placeholder*="nome"]')).toBeVisible()
    await expect(page.locator('input[placeholder*="9999"]')).toBeVisible()
  })

  test('deve mostrar validação para campos obrigatórios', async ({ page }) => {
    await page.goto('/cadastro')

    // Tentar submeter sem preencher
    await page.click('button[type="submit"]')

    // Deve mostrar validação HTML5
    const nomeInput = page.locator('input[placeholder*="nome"]')
    await expect(nomeInput).toHaveAttribute('required', '')
  })

  test('deve preencher formulário com dados básicos', async ({ page }) => {
    await page.goto('/cadastro')

    // Preencher campos obrigatórios
    await page.fill('input[placeholder*="nome"]', 'Maria Teste')
    await page.fill('input[placeholder*="9999"]', '11999999999')

    // Verificar que campos foram preenchidos
    await expect(page.locator('input[placeholder*="nome"]')).toHaveValue('Maria Teste')
    await expect(page.locator('input[placeholder*="9999"]')).toHaveValue('11999999999')
  })

  test('deve ter botão para tirar foto', async ({ page }) => {
    await page.goto('/cadastro')

    const fotoButton = page.locator('button:has-text("Tirar Foto"), button:has-text("foto")').first()
    await expect(fotoButton).toBeVisible()
  })

  test('deve ter campos opcionais visíveis', async ({ page }) => {
    await page.goto('/cadastro')

    // Verificar campos opcionais
    await expect(page.locator('input[placeholder*="pai"]')).toBeVisible()
    await expect(page.locator('input[placeholder*="mãe"]')).toBeVisible()
    await expect(page.locator('input[type="date"]')).toBeVisible()
  })

  test('deve navegar de volta para home', async ({ page }) => {
    await page.goto('/cadastro')

    // Clicar em voltar/home
    const backLink = page.locator('a[href="/"]').first()
    if (await backLink.isVisible()) {
      await backLink.click()
      await expect(page).toHaveURL('/')
    }
  })
})

test.describe('Cadastro - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('deve ser responsivo em mobile', async ({ page }) => {
    await page.goto('/cadastro')

    // Verificar que elementos estão visíveis em mobile
    await expect(page.locator('input[placeholder*="nome"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})
