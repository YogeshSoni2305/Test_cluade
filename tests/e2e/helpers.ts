import { expect, type Page } from "@playwright/test";

export async function loginAs(page: Page, name: string) {
  await page.goto("/dev-login");
  await page.locator("li", { hasText: name }).first().getByRole("button").click();
  await page.waitForLoadState("networkidle");
}

let seq = 0;
/** A unique, valid Indian mobile number per call. */
export function phone() {
  seq += 1;
  return `+91 9${String(Date.now()).slice(-6)}${String(seq).padStart(3, "0")}`;
}

export async function createUser(page: Page, name: string, role: "candidate" | "employer" | "admin", mobile = phone()) {
  await page.goto("/dev-login?signup=1");
  const form = page.locator("form", { has: page.getByRole("button", { name: "Create & continue" }) });
  await form.getByLabel("Name").fill(name);
  await form.getByLabel("Mobile number").fill(mobile);
  await form.locator("label.chip", { hasText: new RegExp(`^${role}$`, "i") }).click();
  await form.getByRole("button", { name: "Create & continue" }).click();
  await page.waitForLoadState("networkidle");
  return mobile;
}

/** Complete the full candidate profile form. */
export async function completeProfile(page: Page, opts: { district?: string; industry?: string; city?: string; searchable?: boolean } = {}) {
  await page.goto("/candidate/profile?mode=full");
  await page.getByLabel("Home district in Rajasthan").selectOption(opts.district ?? "Barmer");
  await page.locator("label.chip", { hasText: opts.industry ?? "Men's clothing" }).click();
  await page.locator("label.chip", { hasText: new RegExp(`^${opts.city ?? "Surat"}$`) }).first().click();
  if (opts.searchable) await page.getByLabel(/Let verified employers find me/).check();
  await page.getByRole("button", { name: /Save & find work|Save profile/ }).click();
  await expect(page).toHaveURL(/\/candidate(\?|$)/);
}

export async function postJob(page: Page, title: string, extra: { description?: string; salary?: string } = {}) {
  await page.goto("/employer/jobs/new");
  await page.getByLabel("Job title").fill(title);
  await page.getByLabel("Salary from (₹)").fill(extra.salary ?? "12000");
  await page.getByLabel("Working hours").fill("10 am – 8 pm");
  if (extra.description) await page.getByLabel("About the role", { exact: true }).fill(extra.description);
  await page.getByLabel("No deductions from salary").check();
  await page.getByRole("button", { name: "Publish listing" }).click();
  await expect(page).toHaveURL(/\/employer\/jobs\/\d+\?posted=1/);
  return Number(page.url().match(/jobs\/(\d+)/)![1]);
}
