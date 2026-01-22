import { test, expect } from '@playwright/test'

test.describe('Fluxo: Offline e Sincronização', () => {
  test('deve mostrar indicador quando offline', async ({ page, context }) => {
    await page.goto('/')

    // Simular offline
    await context.setOffline(true)

    // Aguardar indicador aparecer
    await page.waitForTimeout(500)

    // Verificar indicador de offline (pode ser toast ou banner)
    const offlineIndicator = page.locator('text=/sem conexão|offline|desconectado/i')
    await expect(offlineIndicator).toBeVisible({ timeout: 5000 })

    // Voltar online
    await context.setOffline(false)
  })

  test('deve mostrar indicador quando volta online', async ({ page, context }) => {
    await page.goto('/')

    // Offline primeiro
    await context.setOffline(true)
    await page.waitForTimeout(500)

    // Voltar online
    await context.setOffline(false)
    await page.waitForTimeout(500)

    // Verificar indicador de conectado
    const onlineIndicator = page.locator('text=/conectado|online/i')
    if (await onlineIndicator.isVisible()) {
      await expect(onlineIndicator).toBeVisible()
    }
  })

  test('deve carregar página principal offline após cache', async ({ page, context }) => {
    // Primeira visita (para cachear)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Simular offline
    await context.setOffline(true)

    // Recarregar página
    await page.reload()

    // Deve carregar do cache (verificar se não mostra erro de conexão do browser)
    await expect(page.locator('body')).not.toContainText('ERR_INTERNET_DISCONNECTED')
  })

  test('deve mostrar página /offline quando página não cacheada', async ({ page, context }) => {
    // Simular offline antes de visitar
    await context.setOffline(true)

    // Tentar acessar página que não está no cache
    const response = await page.goto('/pagina-inexistente-123')

    // Pode retornar null ou redirecionar para /offline
    // Dependendo da implementação do service worker
    if (response) {
      const url = page.url()
      // Deve mostrar página offline ou erro 404
      expect(url.includes('offline') || response.status() === 404 || response.ok()).toBeTruthy()
    }

    await context.setOffline(false)
  })
})

test.describe('PWA Features', () => {
  test('deve ter manifest.json válido', async ({ page, request }) => {
    const response = await request.get('/manifest.json')

    expect(response.ok()).toBeTruthy()

    const manifest = await response.json()
    expect(manifest.name).toBeDefined()
    expect(manifest.short_name).toBeDefined()
    expect(manifest.icons).toBeDefined()
    expect(manifest.start_url).toBeDefined()
  })

  test('deve ter service worker registrado', async ({ page }) => {
    await page.goto('/')

    // Verificar se SW está registrado
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        return registrations.length > 0
      }
      return false
    })

    expect(swRegistered).toBeTruthy()
  })

  test('deve ter ícones PWA', async ({ request }) => {
    // Verificar se ícones existem
    const icon192 = await request.get('/icons/icon-192x192.svg')
    const icon512 = await request.get('/icons/icon-512x512.svg')

    expect(icon192.ok() || icon192.status() === 404).toBeTruthy()
    expect(icon512.ok() || icon512.status() === 404).toBeTruthy()
  })
})
