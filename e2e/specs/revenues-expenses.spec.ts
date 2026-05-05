import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth.js';
import { SEED } from '../helpers/seed-data.js';

async function navigateToSection(
  page: import('@playwright/test').Page,
  section: 'Revenues' | 'Expenses' | 'Savings'
) {
  await page.getByText(SEED.budget.name).click();
  await expect(page).toHaveURL(/\/budgets\/.+/);
  await page.getByRole('link', { name: section }).click();
  await expect(page).toHaveURL(new RegExp(`/budgets/.+/${section.toLowerCase()}`));
}

test.describe('Revenues screen', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SEED.owner);
  });

  test('shows the Revenues page with Add row button', async ({ page }) => {
    await navigateToSection(page, 'Revenues');
    await expect(page.getByRole('button', { name: 'Add row' })).toBeVisible();
  });

  test('blocks save when amount is 0 (regression: was silently sending invalid API request)', async ({
    page,
  }) => {
    await navigateToSection(page, 'Revenues');

    // Add a new row (defaults to amount=0)
    await page.getByRole('button', { name: 'Add row' }).click();

    // Try to save without setting amount
    await page.getByRole('button', { name: 'Save all' }).click();

    // Should show validation error, not a generic "[object Object]" error
    await expect(page.getByText('Amount must be greater than 0')).toBeVisible({ timeout: 5_000 });
  });

  test('saves a new revenue row with valid amount', async ({ page }) => {
    await navigateToSection(page, 'Revenues');

    // Add a new row
    await page.getByRole('button', { name: 'Add row' }).click();

    // Edit the amount cell — double-click to enter edit mode
    const amountCell = page.locator('[data-field="amount"]').last();
    await amountCell.dblclick();
    const amountInput = amountCell.locator('input');
    await amountInput.fill('1500');
    await amountInput.press('Tab');

    // Save
    await page.getByRole('button', { name: 'Save all' }).click();
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 8_000 });

    // Verify row is persisted (reload and check)
    await page.reload();
    await expect(page.locator('[data-field="amount"]').filter({ hasText: '1,500' })).toBeVisible({
      timeout: 8_000,
    });

    // Cleanup: delete the row we created
    const deleteBtn = page
      .locator('[data-field="actions"]')
      .last()
      .getByRole('menuitem', { name: 'Delete' });
    await deleteBtn.click();
    await page.getByRole('button', { name: 'Save all' }).click();
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Expenses screen', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SEED.owner);
  });

  test('shows the Expenses page with Add row button', async ({ page }) => {
    await navigateToSection(page, 'Expenses');
    await expect(page.getByRole('button', { name: 'Add row' })).toBeVisible();
  });

  test('blocks save when amount is 0 (regression: was silently sending invalid API request)', async ({
    page,
  }) => {
    await navigateToSection(page, 'Expenses');

    await page.getByRole('button', { name: 'Add row' }).click();
    await page.getByRole('button', { name: 'Save all' }).click();

    await expect(page.getByText('Amount must be greater than 0')).toBeVisible({ timeout: 5_000 });
  });

  test('saves a new regular expense row with valid amount', async ({ page }) => {
    await navigateToSection(page, 'Expenses');

    await page.getByRole('button', { name: 'Add row' }).click();

    const amountCell = page.locator('[data-field="amount"]').last();
    await amountCell.dblclick();
    const amountInput = amountCell.locator('input');
    await amountInput.fill('800');
    await amountInput.press('Tab');

    await page.getByRole('button', { name: 'Save all' }).click();
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 8_000 });

    await page.reload();
    await expect(page.locator('[data-field="amount"]').filter({ hasText: '800' })).toBeVisible({
      timeout: 8_000,
    });

    // Cleanup
    const deleteBtn = page
      .locator('[data-field="actions"]')
      .last()
      .getByRole('menuitem', { name: 'Delete' });
    await deleteBtn.click();
    await page.getByRole('button', { name: 'Save all' }).click();
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 8_000 });
  });
});
