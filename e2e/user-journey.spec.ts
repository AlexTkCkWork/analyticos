import { test, expect } from '@playwright/test';

test('user can register, create a project, and see the tracking snippet', async ({
    page,
}) => {
    const stamp = Date.now();
    const email = `e2e-${stamp}@example.com`;
    const password = 'correcthorsebatterystaple';
    const projectName = 'E2E Test Project';
    const domain = `e2e-${stamp}.com`;

    await page.goto('/register');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/onboarding/);

    await page.getByLabel(/project name/i).fill(projectName);
    await page.getByLabel(/domain/i).fill(domain);
    await page.getByRole('button', { name: /create project/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/[a-z0-9]+$/);

    await expect(
        page.getByRole('heading', { name: projectName })
    ).toBeVisible();
    await expect(page.getByText(`${domain} · Last 7 days`)).toBeVisible();

    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(
        page.getByText(/<script.*data-key=.*script\.js/)
    ).toBeVisible();
});
