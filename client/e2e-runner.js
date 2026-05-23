import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/Users/nawazish/.gemini/antigravity-cli/brain/73c4d551-758b-4995-8b31-a11f751a139a/screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTests() {
  console.log('🚀 Starting end-to-end integration tests for ParkIt...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const consoleErrors = [];

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[Console Error] ${msg.text()} (${page.url()})`);
      console.log(`❌ Console Error: ${msg.text()}`);
    } else {
      console.log(`[Console ${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(`[Page Error] ${err.message} (${page.url()})`);
    console.log(`❌ Unhandled Page Error: ${err.message}`);
  });

  try {
    // ----------------------------------------------------
    // STEP 1: Landing Page
    // ----------------------------------------------------
    console.log('\n--- Step 1: Navigating to Landing Page ---');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000); // Allow animations
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing_page.png') });
    console.log('Saved screenshot 01_landing_page.png');

    // ----------------------------------------------------
    // STEP 2: Driver Flow (Login)
    // ----------------------------------------------------
    console.log('\n--- Step 2: Driver Login ---');
    await page.click('text=Sign In'); // Click login link/button on landing page
    await page.waitForURL('**/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_login_page.png') });

    // Use Quick Demo Login for Driver
    console.log('Logging in as Driver...');
    await page.click('button:has-text("Driver")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_login_driver_filled.png') });

    await page.click('#login-submit');
    await page.waitForURL('**/search');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_search_page.png') });
    console.log('Driver successfully logged in and redirected to search page.');

    // ----------------------------------------------------
    // STEP 3: Driver Flow (Search & Lot Selection)
    // ----------------------------------------------------
    console.log('\n--- Step 3: Search for Delhi & Select Lot ---');
    await page.fill('#city-search-input', 'Delhi');
    await page.click('#city-search-btn');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_search_results_delhi.png') });

    // Click on Metropolis Central Hub
    console.log('Selecting Metropolis Central Hub...');
    await page.click('text=Metropolis Central Hub');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_lot_detail.png') });

    // ----------------------------------------------------
    // STEP 4: Select Slot FIRST
    // ----------------------------------------------------
    console.log('\n--- Step 4: Select Slot ---');
    // Select an available slot in SlotGrid
    // Find slot buttons. Filter for available ones.
    const availableSlotId = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[id^="slot-btn-"]'));
      const available = buttons.find(btn => !btn.disabled);
      return available ? available.id : null;
    });

    if (!availableSlotId) {
      throw new Error('No available slot found in the grid to book!');
    }

    console.log(`Selecting available slot: ${availableSlotId}`);
    await page.click(`#${availableSlotId}`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_slot_selected.png') });

    // ----------------------------------------------------
    // STEP 5: Verify End-Time Validation
    // ----------------------------------------------------
    console.log('\n--- Step 5: Verify End-Time Validation ---');
    
    // Locating start time input (index 0) and end time input (index 1) using Playwright locators
    const dateInputs = page.locator('input[type="datetime-local"]');
    const startTimeVal = await dateInputs.nth(0).inputValue();
    console.log(`Current Start Time: ${startTimeVal}`);

    if (!startTimeVal) {
      throw new Error('Could not read start time value from input!');
    }

    // Parse start time, subtract 1 hour for invalid end time
    const startDate = new Date(startTimeVal);
    const invalidEndDate = new Date(startDate.getTime() - 60 * 60 * 1000);
    const invalidEndTimeStr = new Date(invalidEndDate.getTime() - invalidEndDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    // Use Playwright locator fill to input the invalid end time
    console.log(`Filling invalid end time: ${invalidEndTimeStr}`);
    await dateInputs.nth(1).fill(invalidEndTimeStr);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_invalid_time_error.png') });

    // Verify error text is visible
    const hasError = await page.isVisible('text=End time must be after start time');
    const isButtonDisabled = await page.$eval('button:has-text("Pay")', btn => btn.disabled);
    console.log(`Validation Error Present: ${hasError}, Pay Button Disabled: ${isButtonDisabled}`);

    if (!hasError || !isButtonDisabled) {
      throw new Error('End-time validation failed to trigger or disable submit button!');
    }

    // ----------------------------------------------------
    // STEP 6: Complete Booking
    // ----------------------------------------------------
    console.log('\n--- Step 6: Complete Booking ---');
    // Set a valid end time: start time + 2 hours
    const validEndDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const validEndTimeStr = new Date(validEndDate.getTime() - validEndDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    console.log(`Filling valid end time: ${validEndTimeStr}`);
    await dateInputs.nth(1).fill(validEndTimeStr);
    
    console.log('Filling license plate...');
    await page.fill('input[placeholder*="MH12AB1234"]', 'DL3CAF1234');
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_valid_times_configured.png') });

    // Click Book and Pay
    console.log('Clicking Pay button...');
    await page.click('button:has-text("Pay")');

    // Wait for the booking success modal
    console.log('Waiting for success confirmation modal...');
    await page.waitForSelector('text=Booking Confirmed!', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_booking_confirmed_modal.png') });

    // Click "View My Bookings"
    console.log('Navigating to My Bookings...');
    await page.click('button:has-text("View My Bookings")');
    await page.waitForURL('**/bookings');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_my_bookings.png') });

    // Get the booking ID to cancel
    const bookingToCancelId = await page.evaluate(() => {
      const cancelBtn = document.querySelector('button[id^="cancel-btn-"]');
      if (cancelBtn) {
        const match = cancelBtn.id.match(/cancel-btn-(\d+)/);
        return match ? match[1] : null;
      }
      return null;
    });

    if (!bookingToCancelId) {
      throw new Error('Could not find active booking to cancel!');
    }

    console.log(`Booking ID to cancel: ${bookingToCancelId}`);

    // Click Cancel Button
    await page.click(`#cancel-btn-${bookingToCancelId}`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_cancel_confirmation_state.png') });

    // Click Confirm
    console.log('Confirming cancellation...');
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_booking_cancelled.png') });
    console.log('Booking successfully cancelled.');

    // Logout
    console.log('Signing out...');
    await page.click('#navbar-user-menu');
    await page.waitForTimeout(500);
    await page.click('#navbar-logout');
    await page.waitForURL('**/login');
    await page.waitForTimeout(1000);
    console.log('Logged out of Driver session.');

    // ----------------------------------------------------
    // STEP 7: Owner Flow (Add Lot)
    // ----------------------------------------------------
    console.log('\n--- Step 7: Owner Flow ---');
    await page.click('button:has-text("Owner")');
    await page.waitForTimeout(500);
    await page.click('#login-submit');
    await page.waitForURL('**/owner');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_owner_dashboard.png') });

    // Click Add Lot
    console.log('Opening Add Lot Modal...');
    await page.click('#add-lot-btn');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_add_lot_modal.png') });

    // Fill form using Playwright fill API
    const uniqueLotName = `Playwright Test Lot ${Date.now().toString().slice(-4)}`;
    console.log(`Creating Lot: ${uniqueLotName}`);
    await page.fill('input[placeholder*="Downtown Central"]', uniqueLotName);
    await page.fill('input[placeholder*="42 MG Road"]', '101 Playwright Road, Sector 8');
    await page.fill('input[placeholder*="Mumbai"]', 'Delhi');
    await page.fill('input[type="number"]', '50');
    await page.fill('input[placeholder*="CCTV"]', 'CCTV, Security, EV Charging');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_add_lot_form_filled.png') });

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500); // Wait for API and auto-refresh
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_owner_dashboard_with_new_lot.png') });

    // Verify status is pending in properties list
    const lotListText = await page.innerText('main');
    if (!lotListText.includes(uniqueLotName) || !lotListText.includes('PENDING')) {
      throw new Error(`Owner dashboard did not list the new lot "${uniqueLotName}" as PENDING!`);
    }
    console.log(`Successfully added lot "${uniqueLotName}" and verified its PENDING status.`);

    // Logout
    await page.click('#navbar-user-menu');
    await page.waitForTimeout(500);
    await page.click('#navbar-logout');
    await page.waitForURL('**/login');
    await page.waitForTimeout(1000);
    console.log('Logged out of Owner session.');

    // ----------------------------------------------------
    // STEP 8: Admin Flow (Approve Lot)
    // ----------------------------------------------------
    console.log('\n--- Step 8: Admin Flow ---');
    await page.click('button:has-text("Admin")');
    await page.waitForTimeout(500);
    await page.click('#login-submit');
    await page.waitForURL('**/admin');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_admin_dashboard.png') });

    // Approve the lot
    console.log(`Approving Lot: ${uniqueLotName}`);
    // Find the lot list and click Approve
    const lotApproveBtnId = await page.evaluate((lotName) => {
      // Find all lot cards in Admin Dashboard
      const cards = Array.from(document.querySelectorAll('.admin-lot-card'));
      const targetCard = cards.find(card => card.textContent && card.textContent.includes(lotName));
      if (targetCard) {
        const approveBtn = targetCard.querySelector('button[id^="approve-lot-"]');
        return approveBtn ? approveBtn.id : null;
      }
      return null;
    }, uniqueLotName);

    if (!lotApproveBtnId) {
      throw new Error(`Could not find the approve button for lot: ${uniqueLotName}`);
    }

    console.log(`Clicking Approve button: ${lotApproveBtnId}`);
    await page.click(`#${lotApproveBtnId}`);
    await page.waitForTimeout(2500); // Wait for API update
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_admin_dashboard_approved.png') });

    // Verify status is updated to approved
    const adminLotText = await page.innerText('main');
    if (adminLotText.includes(uniqueLotName) && adminLotText.includes('pending')) {
      throw new Error(`Lot "${uniqueLotName}" status is still pending after approval click!`);
    }
    console.log(`Successfully approved lot "${uniqueLotName}" on Admin Dashboard.`);

    // Logout
    await page.click('#navbar-user-menu');
    await page.waitForTimeout(500);
    await page.click('#navbar-logout');
    await page.waitForURL('**/login');
    await page.waitForTimeout(1000);
    console.log('Logged out of Admin session.');

    // ----------------------------------------------------
    // CONCLUSION
    // ----------------------------------------------------
    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log(`Console Errors encountered: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Warning: Some console errors were captured during testing:');
      consoleErrors.forEach(err => console.log(` - ${err}`));
    }

  } catch (err) {
    console.error('❌ Integration test failed with error:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_failure.png') });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
