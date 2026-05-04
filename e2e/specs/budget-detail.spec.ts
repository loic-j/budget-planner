import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth.js';
import { SEED } from '../helpers/seed-data.js';

async function navigateToSeedBudget(page: import('@playwright/test').Page) {
  await page.getByText(SEED.budget.name).click();
  await expect(page).toHaveURL(/\/budgets\/.+/);
}

// Wait until the invite list section has loaded (at least 1 copy button visible)
async function waitForInviteList(page: import('@playwright/test').Page) {
  const copyLocator = page
    .getByRole('button')
    .filter({ has: page.locator('[data-testid="ContentCopyIcon"]') });
  await expect(copyLocator.first()).toBeVisible({ timeout: 10_000 });
  return copyLocator;
}

test.describe('Budget Detail', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SEED.owner);
    await navigateToSeedBudget(page);
  });

  test('shows the budget name in the header', async ({ page }) => {
    await expect(page.getByText(SEED.budget.name)).toBeVisible();
  });

  test('back button navigates to budget list', async ({ page }) => {
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('My Budgets')).toBeVisible();
  });

  test('Members tab is visible and active by default', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Members' })).toBeVisible();
  });
});

test.describe('Budget Detail – Members Tab', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SEED.owner);
    await navigateToSeedBudget(page);
  });

  test('shows seed owner as OWNER', async ({ page }) => {
    await expect(page.getByText(SEED.owner.name)).toBeVisible();
    await expect(page.getByText('OWNER')).toBeVisible();
  });

  test('shows seed member as VIEWER', async ({ page }) => {
    await expect(page.getByText(SEED.member.name)).toBeVisible();
    await expect(page.getByText('VIEWER')).toBeVisible();
  });

  test('Invite button is visible for OWNER', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Invite', exact: true })).toBeVisible();
  });

  test('Invite button is NOT visible for non-owner member', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(SEED.member.email);
    await page.getByLabel('Password', { exact: true }).fill(SEED.member.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/');
    await navigateToSeedBudget(page);
    await expect(page.getByRole('button', { name: 'Invite', exact: true })).not.toBeVisible();
  });

  test('invite links section is shown with at least the seed invite', async ({ page }) => {
    await expect(page.getByText('Invite links')).toBeVisible();
    // At least one copy button must be present (seed invite)
    const copyLocator = await waitForInviteList(page);
    expect(await copyLocator.count()).toBeGreaterThan(0);
  });

  test('creating an invite adds a new row to the invite list', async ({ page }) => {
    // Wait for invite list to load and capture baseline count
    const copyLocator = await waitForInviteList(page);
    const before = await copyLocator.count();

    await page.getByRole('button', { name: 'Invite', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Wait for API to respond then check count increased
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/invites') && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Create link' }).click(),
    ]);
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(copyLocator).toHaveCount(before + 1, { timeout: 10_000 });
  });

  test('copy invite link button is present for the seed invite', async ({ page }) => {
    const copyLocator = await waitForInviteList(page);
    await expect(copyLocator.first()).toBeVisible();
  });

  test('revoking an invite removes it from the list', async ({ page }) => {
    // First create an invite to have something to revoke predictably
    await waitForInviteList(page);

    await page.getByRole('button', { name: 'Invite', exact: true }).click();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/invites') && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Create link' }).click(),
    ]);
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Scope to revoke-invite buttons only (title="Revoke invite"), not member-removal buttons
    const deleteLocator = page.getByRole('button', { name: 'Revoke invite' });
    await expect(deleteLocator.first()).toBeVisible({ timeout: 10_000 });
    const count = await deleteLocator.count();
    expect(count).toBeGreaterThan(0);

    // Revoke the first invite (newest, since list is desc) to avoid revoking the seed invite
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/invites') && r.request().method() === 'DELETE'
      ),
      deleteLocator.first().click(),
    ]);
    await expect(deleteLocator).toHaveCount(count - 1, { timeout: 10_000 });
  });
});

test.describe('Budget Detail – Invite Accept Flow', () => {
  test('invite preview page shown without auth', async ({ page }) => {
    await page.goto(`/invite/${SEED.inviteToken}`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByText(SEED.budget.name)).toBeVisible({ timeout: 10_000 });
  });

  test('authenticated user can accept invite and see success', async ({ page }) => {
    const unique = `invite-${Date.now()}`;
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Invite Tester');
    await page.getByLabel('Email address').fill(`${unique}@example.com`);
    await page.getByLabel('Password', { exact: true }).fill('Invite1234!');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL('/');

    await page.goto(`/invite/${SEED.inviteToken}`);
    await expect(page.getByText(SEED.budget.name)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Accept invitation' }).click();
    await expect(page.getByText("You're in!")).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Open budget' }).click();
    await expect(page).toHaveURL(/\/budgets\/.+/);
  });
});
