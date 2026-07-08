import { test, expect } from '@playwright/test'

test('dropzone renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#dropzone')).toBeVisible()
  await expect(page.locator('#file-select')).toBeVisible()
})
