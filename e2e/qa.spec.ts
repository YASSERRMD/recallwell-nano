import { test, expect } from '@playwright/test'

test('question input renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#question')).toBeVisible()
  await expect(page.locator('#ask-btn')).toBeVisible()
})

test('can type question', async ({ page }) => {
  await page.goto('/')
  await page.fill('#question', 'What is this?')
  await expect(page.locator('#question')).toHaveValue('What is this?')
})
