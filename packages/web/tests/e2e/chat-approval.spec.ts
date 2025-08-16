import { test, expect } from '@playwright/test';

test('chat creates session and streams response', async ({ page }) => {
	await page.goto('/');
	// Composer input exists
	const input = page.getByPlaceholder('Type your message');
	expect(await input.count()).toBeGreaterThan(0);
	await input.fill('Hello');
	await input.press('Enter');
	// Expect assistant bubble to appear eventually
	await expect(page.locator('[data-role="assistant"]')).toHaveCount(1, { timeout: 20000 });
});



