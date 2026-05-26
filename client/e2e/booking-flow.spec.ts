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

    // Click first lot card
    const firstLot = page.locator('[id^="lot-card-"]').first();
    await firstLot.click();

    await page.waitForURL('**/lot/**');

    // Pick first available slot
    const slot = page.locator('button[id^="slot-btn-"]:not([disabled])').first();
    await slot.click({ force: true });

    // Fill plate (the one from user report)
    await page.fill('input[placeholder="MH12AB1234"]', '7YYHH9');

    // Click Pay
    await page.click('button:has-text("Pay")');

    // Wait for success dialog (demo path)
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible({ timeout: 15000 });

    // Verify we can navigate to bookings
    await page.click('button:has-text("View My Bookings")');
    await page.waitForURL('**/bookings');
    await expect(page.locator('text=Active Passes')).toBeVisible();
  });
});
