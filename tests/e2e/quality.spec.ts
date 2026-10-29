import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginAs } from "./helpers";

const PUBLIC = ["/", "/jobs", "/jobs/1", "/employers/1", "/safety", "/employer", "/letters"];

for (const lang of ["en", "hi"] as const) {
  test(`no WCAG 2.1 AA violations on public pages (${lang})`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "lang", value: lang, url: baseURL! }]);
    for (const path of PUBLIC) {
      await page.goto(path);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(r.violations.map((v) => `${path}: ${v.id}`)).toEqual([]);
    }
  });
}

test("no violations on signed-in pages", async ({ page }) => {
  await loginAs(page, "Mahendra");
  for (const path of ["/candidate", "/candidate/profile?mode=full", "/candidate/profile?mode=simple", "/messages", "/notifications", "/account"]) {
    await page.goto(path);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(r.violations.map((v) => `${path}: ${v.id}`)).toEqual([]);
  }
});

test("Hindi toggle translates the interface and returns to the same page", async ({ page }) => {
  await page.goto("/jobs/1");
  await page.getByRole("button", { name: "हिन्दी" }).click();
  await expect(page).toHaveURL(/\/jobs\/1$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(page.getByRole("heading", { name: "शर्तें" })).toBeVisible();
  await expect(page.getByText("हमारे शोरूम में ट्रेनी के रूप में जुड़ें", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "The terms" })).toBeVisible();
});

test("SEO: robots, sitemap, structured data, share image, manifest", async ({ page, request }) => {
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /admin");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toMatch(/<loc>[^<]+\/jobs\/1<\/loc>/);
  await page.goto("/jobs/1");
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent())!);
  expect(ld["@type"]).toBe("JobPosting");
  expect(ld.baseSalary.currency).toBe("INR");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toContain("/jobs/1/opengraph-image");
  const img = await request.get(new URL(og!).pathname);
  expect(img.headers()["content-type"]).toBe("image/png");
  expect((await request.get("/manifest.webmanifest")).status()).toBe(200);
});

test("saved jobs open offline through the service worker", async ({ page, context }) => {
  await page.goto("/jobs/2");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.getByRole("button", { name: "Save for offline" }).click();
  await expect(page.getByRole("button", { name: "Saved for offline" })).toBeVisible();
  await context.setOffline(true);
  await page.goto("/jobs/2");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Billing & Inventory Assistant");
  await page.goto("/jobs/9");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You’re offline");
  await context.setOffline(false);
});
