import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth.js';
import { SEED } from '../helpers/seed-data.js';

test.describe('Budget List', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SEED.owner);
  });

  test('shows seed budget in the list', async ({ page }) => {
    await expect(page.getByText(SEED.budget.name)).toBeVisible();
  });

  test('clicking a budget card navigates to budget detail', async ({ page }) => {
    await page.getByText(SEED.budget.name).click();
    await expect(page).toHaveURL(/\/budgets\/.+/);
  });

  test('"New budget" button opens create dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'New budget' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // Dialog title is "New Budget" — scope to dialog to avoid matching button text
    await expect(page.getByRole('dialog').getByText('New Budget')).toBeVisible();
  });

  test('creating a budget adds it to the list', async ({ page }) => {
    const budgetName = `E2E Budget ${Date.now()}`;
    await page.getByRole('button', { name: 'New budget' }).click();
    await page.getByLabel('Budget name').fill(budgetName);
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText(budgetName)).toBeVisible();
  });

  test('create dialog validates end date after start date', async ({ page }) => {
    await page.getByRole('button', { name: 'New budget' }).click();
    await page.getByLabel('Budget name').fill('Test');
    await page.getByLabel('Start date').fill('2026-12-31');
    await page.getByLabel('End date').fill('2026-01-01');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('End date must be after start date')).toBeVisible();
  });

  test('empty state is shown for a brand-new user', async ({ page }) => {
    const unique = `empty-${Date.now()}`;
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Empty User');
    await page.getByLabel('Email address').fill(`${unique}@example.com`);
    await page.getByLabel('Password', { exact: true }).fill('Empty123!');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('No budgets yet')).toBeVisible();
  });
});
