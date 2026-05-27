import { test, expect } from '@playwright/test';

test.describe('ParkIt Mobile Booking Flow (Demo)', () => {
  test('driver can search, select slot, and complete demo booking', async ({ page }) => {
    // Go to login (direct for mobile)
    await page.goto('/login');
    await page.fill('#login-email', 'driver@demo.com');
    await page.fill('#login-password', 'demo123');
    await page.click('#login-submit');

    await page.waitForURL('**/search');

    // Search Delhi
    await page.fill('#city-search-input', 'Delhi');
    await page.click('#city-search-btn');
    await page.waitForTimeout(1200);

    // Open a lot that has at least one available slot
    const lotCards = page.locator('[id^="lot-card-"]');
    await expect(lotCards.first()).toBeVisible({ timeout: 15000 });

    const lotCount = await lotCards.count();
    let slotChosen = false;

    for (let i = 0; i < lotCount; i += 1) {
      await lotCards.nth(i).click();
      await page.waitForURL('**/lot/**');
      await page.locator('[id^="slot-btn-"]').first().waitFor({ state: 'visible', timeout: 15000 });

      const availableSlots = page.locator('button[id^="slot-btn-"]:not([disabled])');
      if (await availableSlots.count()) {
        await availableSlots.first().click({ force: true });
        slotChosen = true;
        break;
      }

      await page.goBack();
      await page.waitForURL('**/search');
      await expect(lotCards.first()).toBeVisible({ timeout: 10000 });
    }

    expect(slotChosen).toBeTruthy();

    // Fill plate (the one from user report)
    await page.fill('input[placeholder="MH12AB1234"]', '7YYHH9');

    // Force deterministic demo payment path for CI/local headless runs.
    await page.route('**/api/payment/order', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          key_id: 'demo_mode',
          order: {
            id: `order_demo_test_${Date.now()}`,
            entity: 'order',
            amount: 1000,
            currency: 'INR',
            receipt: `receipt_test_${Date.now()}`,
            status: 'created',
          },
        }),
      });
    });

    // Click Pay
    await page.click('button:has-text("Pay")');

    // Deterministic success assertion: either confirmation dialog or success toast
    const confirmedDialog = page.getByText('Booking Confirmed!');
    const confirmedToast = page.getByRole('status').filter({ hasText: 'Booking confirmed' });
    await Promise.race([
      confirmedDialog.waitFor({ state: 'visible', timeout: 20000 }),
      confirmedToast.waitFor({ state: 'visible', timeout: 20000 }),
    ]);

    // Navigate directly to bookings to avoid viewport-specific modal button interactions
    await page.goto('/bookings');
    await page.waitForURL('**/bookings');
    await expect(page.locator('text=Active Passes')).toBeVisible();
  });
});
