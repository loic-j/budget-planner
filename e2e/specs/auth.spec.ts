import { test, expect } from '@playwright/test';
import { SEED } from '../helpers/seed-data.js';

test.describe('Authentication', () => {
  test('unauthenticated user visiting / is redirected to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user visiting a budget page is redirected to /login', async ({ page }) => {
    await page.goto('/budgets/some-id');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page shows correct title', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Budget Planner')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(SEED.owner.email);
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword1!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
  });

  test('login with valid credentials lands on budget list', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(SEED.owner.email);
    await page.getByLabel('Password', { exact: true }).fill(SEED.owner.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('My Budgets')).toBeVisible();
  });

  test('register link navigates to register page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Create an account' }).click();
    await expect(page).toHaveURL('/register');
  });

  test('register new account and land on budget list', async ({ page }) => {
    const unique = `e2e-${Date.now()}`;
    await page.goto('/register');
    await page.getByLabel('Full name').fill('E2E Test User');
    await page.getByLabel('Email address').fill(`${unique}@example.com`);
    await page.getByLabel('Password', { exact: true }).fill('E2eTest1!');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('My Budgets')).toBeVisible();
  });

  test('sign out redirects to /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(SEED.owner.email);
    await page.getByLabel('Password', { exact: true }).fill(SEED.owner.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page has link back from register page', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
  });
});
