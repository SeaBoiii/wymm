import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const revealEverything = async (page) => {
  await page.addStyleTag({
    content: ".reveal{opacity:1!important;transform:none!important;transition:none!important}",
  });
};

const expectNoSeriousAxeViolations = async (page) => {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact)
  );
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
};

test("pre-rendered garden is complete, quiet, and accessible", async ({ page }) => {
  const pageErrors = [];
  const responseErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) responseErrors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Nurulain");
  await expect(page.locator(".memory-card")).toHaveCount(5);
  await expect(page.locator(".promise-card")).toHaveCount(3);
  await expect(page.locator(".reason-card")).toHaveCount(4);
  await expect(page.locator("#yesButton")).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator("#questionCard")).toBeHidden();
  await expect(page.locator("#celebration")).toBeHidden();

  await revealEverything(page);
  await expectNoSeriousAxeViolations(page);
  expect(pageErrors).toEqual([]);
  expect(responseErrors).toEqual([]);
});

test("the complete story remains readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("#story-heading")).toBeVisible();
  await expect(page.locator(".memory-card")).toHaveCount(5);
  await expect(page.locator(".memory-card").first()).toBeVisible();
  await expect(page.locator(".proposal-content")).toBeVisible();
  await expect(page.locator('[data-enhanced-only]')).toBeHidden();

  const dimensions = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
  await context.close();
});

test("missing IntersectionObserver degrades to visible content", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: undefined,
    });
  });

  await page.goto("/");
  const hiddenReveals = await page.locator(".reveal").evaluateAll((elements) =>
    elements.filter((element) => Number.parseFloat(getComputedStyle(element).opacity) < 0.99).length
  );
  expect(hiddenReveals).toBe(0);
  expect(pageErrors).toEqual([]);
});

test("proposal flow retains keyboard focus and exposes one clear answer", async ({ page }) => {
  await page.goto("/");
  await page.locator("#proposalButton").scrollIntoViewIfNeeded();
  await page.locator("#proposalButton").focus();
  await page.keyboard.press("Enter");

  await expect(page.locator("#questionCard")).toBeVisible();
  await expect(page.locator("#proposalButton")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#questionHeading")).toBeFocused();
  await expect(page.locator(".answer-row button")).toHaveCount(1);

  await page.locator("#yesButton").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#celebration")).toBeVisible();
  await expect(page.locator("#questionCard")).toBeHidden();
  await expect(page.locator("#celebrationHeading")).toBeFocused();
  await expect(page.locator("#proposalStatus")).toContainText("celebration");

  await revealEverything(page);
  await expectNoSeriousAxeViolations(page);
});

test("reduced motion creates no ambient effects and changes states immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForTimeout(250);

  await expect(page.locator("[data-generated-effect]")).toHaveCount(0);
  const hiddenReveals = await page.locator(".reveal").evaluateAll((elements) =>
    elements.filter((element) => Number.parseFloat(getComputedStyle(element).opacity) < 0.99).length
  );
  expect(hiddenReveals).toBe(0);

  await page.locator("#proposalButton").click();
  await expect(page.locator("#questionCard")).toBeVisible();
  await page.locator("#yesButton").click();
  await expect(page.locator("#celebration")).toBeVisible();
  await expect(page.locator("[data-generated-effect]")).toHaveCount(0);
});

test("share action falls back to a local keepsake download", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: undefined });
  });
  await page.goto("/");
  await page.locator("#proposalButton").click();
  await expect(page.locator("#questionCard")).toBeVisible();
  await page.locator("#yesButton").click();
  await expect(page.locator("#celebration")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#shareCardButton").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("a-new-chapter-in-bloom.png");
  await expect(page.locator("#proposalStatus")).toContainText("downloaded");
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 801, height: 900 },
  { width: 1024, height: 768 },
  { width: 1440, height: 1000 },
  { width: 844, height: 390 },
]) {
  test(`layout has no horizontal overflow at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await revealEverything(page);

    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".memory-card").first()).toBeVisible();
    await expect(page.locator("#proposalButton")).toBeVisible();
  });
}

test("two-hundred-percent text sizing keeps the mobile page usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.addStyleTag({ content: "html{font-size:200%!important}.reveal{opacity:1!important}" });

  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
  await expect(page.locator("#proposalButton")).toBeVisible();
  await expect(page.locator("h1")).toBeVisible();
});
