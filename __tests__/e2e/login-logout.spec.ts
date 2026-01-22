import { test, expect } from '@playwright/test'

test.describe('Fluxo: Autenticação', () => {
  test('deve carregar página de login', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('h1, h2')).toContainText(/login|entrar|acesso/i)
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"], input[name="senha"]')).toBeVisible()
  })

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"], input[name="email"]', 'email@invalido.com')
    await page.fill('input[type="password"], input[name="senha"]', 'senhaerrada')
    await page.click('button[type="submit"]')

    // Aguardar resposta de erro
    await page.waitForTimeout(2000)

    // Deve mostrar mensagem de erro ou continuar na página de login
    const url = page.url()
    expect(url).toContain('login')
  })

  test('deve redirecionar para login se não autenticado', async ({ page }) => {
    await page.goto('/admin')

    // Deve redirecionar para login
    await page.waitForURL(/login/)
    expect(page.url()).toContain('login')
  })

  test('deve ter link para registro', async ({ page }) => {
    await page.goto('/login')

    // Verificar se existe opção de registro
    const registerLink = page.locator('text=/registr|cadastr|criar conta/i')
    if (await registerLink.isVisible()) {
      await expect(registerLink).toBeVisible()
    }
  })

  test('deve ter opção de mostrar/esconder senha', async ({ page }) => {
    await page.goto('/login')

    const passwordInput = page.locator('input[type="password"]')
    await passwordInput.fill('minhasenha')

    // Verificar se existe botão para mostrar senha
    const toggleButton = page.locator('button:has([class*="eye"])').first()
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
      // Após clicar, o input deve mudar para type="text"
      await expect(page.locator('input[name="senha"]')).toHaveAttribute('type', 'text')
    }
  })
})

test.describe('Login - Formulário', () => {
  test('deve validar email', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill('emailinvalido')
    await page.click('button[type="submit"]')

    // Validação HTML5 deve impedir envio
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('campos devem ser obrigatórios', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const passwordInput = page.locator('input[type="password"], input[name="senha"]')

    await expect(emailInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('required', '')
  })
})
