import { browser } from "k6/browser";
import { Trend, Counter } from "k6/metrics";
import { sleep } from "k6";

// ============================================================================
// CONFIGURATION
// ============================================================================
// Configure the target environment, virtual users (VUs), and duration.
const BASE_URL = "https://sigai-crime-lab.vercel.app";
const USERS = 20;
const DURATION = "2m";

export const options = {
  scenarios: {
    browser: {
      executor: "constant-vus",
      exec: "browserScenario",
      vus: USERS,
      duration: DURATION,
      options: {
        browser: {
          type: "chromium",
        },
      },
    },
  },
  thresholds: {
    browser_errors: ["count<5"], // Fail if there are more than 5 browser errors
    browser_failed_navigations: ["count<2"], // Fail if there are more than 2 failed navigations
  },
};

// ============================================================================
// CUSTOM METRICS
// ============================================================================
const pageLoadTimeTrend = new Trend("browser_page_load_time", true);
const lcpTrend = new Trend("browser_lcp", true);
const navigationDurationTrend = new Trend("browser_navigation_duration", true);
const failedNavigationsCounter = new Counter("browser_failed_navigations");
const browserErrorsCounter = new Counter("browser_errors");

// ============================================================================
// REUSABLE HELPER FUNCTIONS
// ============================================================================

/**
 * Visit page and wait for HTML document load and network idle state.
 * Returns the page response object.
 */
async function visitPage(page, url) {
  console.log(`Navigating to: ${url}`);
  const startTime = Date.now();
  const response = await page.goto(url);
  
  // Wait until HTML document loads
  await page.waitForLoadState("load");
  
  // Wait until network activity becomes idle (no requests for 500ms)
  await page.waitForLoadState("networkidle");
  
  const loadTime = Date.now() - startTime;
  pageLoadTimeTrend.add(loadTime);
  
  return response;
}

/**
 * Wait for React/Next.js hydration completion.
 */
async function waitForReact(page) {
  try {
    await page.waitForFunction(
      () => window.next !== undefined || document.readyState === "complete",
      { timeout: 5000 }
    );
  } catch (e) {
    console.log("React/Next.js hydration check timed out, proceeding anyway.");
  }
}

/**
 * Verify page response is OK, checks for client/server errors or crash overlays,
 * and ensures required content or selectors are rendered and visible.
 */
async function verifyPage(page, response, expectedContent) {
  if (!response) {
    throw new Error("No response returned from the page.");
  }

  const status = response.status();
  if (status !== 200) {
    throw new Error(`HTTP status is not OK. Received: ${status}`);
  }

  const content = await page.content();
  
  // Check for Next.js client-side exception or server error screen
  if (content.includes("Application error: a client-side exception has occurred")) {
    throw new Error("Next.js application crash detected (client-side exception).");
  }
  if (content.includes("Internal Server Error") || content.includes("Failed to load")) {
    throw new Error("Server-side error or page crash detected.");
  }

  // Check for visible content using locator or text comparison
  if (expectedContent) {
    if (expectedContent.startsWith("/") || expectedContent.startsWith(".") || expectedContent.startsWith("#") || expectedContent.includes("[")) {
      const locator = page.locator(expectedContent);
      await locator.waitFor({ state: "visible", timeout: 8000 });
    } else {
      const pageTitle = await page.title();
      const lowerExpected = expectedContent.toLowerCase();
      if (!pageTitle.toLowerCase().includes(lowerExpected) && !content.toLowerCase().includes(lowerExpected)) {
        throw new Error(`Could not find expected content/title "${expectedContent}" on page.`);
      }
    }
  }
}

/**
 * Capture Largest Contentful Paint (LCP) performance score via PerformanceObserver.
 */
async function recordLcp(page) {
  try {
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            resolve(entries[entries.length - 1].startTime);
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
        
        // Timeout after 3 seconds
        setTimeout(() => resolve(0), 3000);
      });
    });
    
    if (lcp > 0) {
      lcpTrend.add(lcp);
    }
  } catch (e) {
    // Suppress failures on pages where observers aren't supported or are blocked
  }
}

/**
 * Safe navigation wrapper encapsulating visit, hydration, verification and metrics collection.
 */
async function navigateSafely(page, path, expectedContent = "") {
  const fullUrl = `${BASE_URL}${path}`;
  const startTime = Date.now();
  
  try {
    const response = await visitPage(page, fullUrl);
    await waitForReact(page);
    await verifyPage(page, response, expectedContent);
    await recordLcp(page);
    
    const duration = Date.now() - startTime;
    navigationDurationTrend.add(duration);
    console.log(`Successfully loaded ${path} in ${duration}ms`);
  } catch (error) {
    failedNavigationsCounter.add(1);
    browserErrorsCounter.add(1);
    console.error(`[Error] Navigation to ${path} failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// MAIN SCENARIO
// ============================================================================
export async function browserScenario() {
  const page = await browser.newPage();

  try {
    // 1. Visit Homepage
    await navigateSafely(page, "/", "AI Crime Lab");
    
    // 2. Navigate to Login Page
    await navigateSafely(page, "/login", "login");

    // 3. Handle login authentication if credentials form is present
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      console.log("Authentication forms found. Performing login...");
      
      // PLACEHOLDERS: Change credentials to valid testing accounts in Supabase
      const EMAIL = "testuser@example.com";
      const PASSWORD = "securepassword123";
      
      await emailInput.fill(EMAIL);
      await passwordInput.fill(PASSWORD);

      // Submit form and wait for redirect
      await Promise.all([
        page.waitForNavigation(),
        submitButton.click(),
      ]);
      
      await page.waitForLoadState("networkidle");
      console.log("Login submission processed.");
    } else {
      console.log("Login form not visible (already logged in or on a redirected session).");
    }

    // 4. Navigate to Results
    await navigateSafely(page, "/results", "score");

    // 5. Navigate Sequentially through the game rounds
    await navigateSafely(page, "/round1", "Round 1");
    await navigateSafely(page, "/round2", "Round 2");
    await navigateSafely(page, "/round3", "Round 3");
    await navigateSafely(page, "/round4", "Round 4");

    // Short cool-down period
    sleep(1);

  } catch (error) {
    console.error(`[Failure] Scenario execution failed: ${error.message}`);
  } finally {
    // Ensure browser resources are cleaned up cleanly
    await page.close();
    console.log("Browser context closed successfully.");
  }
}
