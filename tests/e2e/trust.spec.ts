import { expect, test } from "@playwright/test";
import { createUser, loginAs, phone } from "./helpers";

test.describe.configure({ mode: "serial" });

test("bots filling the hidden field are blocked", async ({ page }) => {
  await page.goto("/dev-login?signup=1");
  const form = page.locator("form", { has: page.getByRole("button", { name: "Create & continue" }) });
  await form.getByLabel("Name").fill("Bot");
  await page.evaluate(() => { (document.querySelector('input[name="website"]') as HTMLInputElement).value = "http://spam"; });
  await form.getByRole("button", { name: "Create & continue" }).click();
  await expect(page.getByText("Submission blocked.")).toBeVisible();
});

test("one account per mobile number", async ({ page }) => {
  const mobile = phone();
  await createUser(page, "First Person", "candidate", mobile);
  await createUser(page, "Second Person", "candidate", mobile.replace("+91 ", "0"));
  await expect(page.getByText(/already exists/)).toBeVisible();
});

test("reports reach moderators, duplicates are refused, and the reporter hears back", async ({ page }) => {
  await loginAs(page, "Mahendra");
  await page.goto("/jobs/1/report");
  await page.locator("label.chip", { hasText: "Unpaid or late wages" }).click();
  await page.getByLabel("What happened?").fill("Two months salary pending since August.");
  await page.getByRole("button", { name: "Submit report" }).click();
  await expect(page.getByText(/Your report was received/)).toBeVisible();
  await page.goto("/jobs/1/report");
  await page.getByLabel("What happened?").fill("Again the same problem.");
  await page.getByRole("button", { name: "Submit report" }).click();
  await expect(page.getByText(/already have an open report/)).toBeVisible();

  await loginAs(page, "Platform Admin");
  await page.goto("/admin/reports?q=salary%20pending");
  const card = page.locator("article", { hasText: "Two months salary pending" });
  await card.getByLabel("Status").selectOption("investigating");
  await card.getByLabel(/Outcome/).fill("We have contacted the employer.");
  await card.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Updated.")).toBeVisible();

  await loginAs(page, "Mahendra");
  await page.goto("/notifications");
  await expect(page.getByText("We’re looking into your report")).toBeVisible();
});

test("suspended users are locked out; admin roles are enforced; everything is audited", async ({ page }) => {
  await createUser(page, "Spammy Sam", "candidate");
  await loginAs(page, "Platform Admin");
  await page.goto("/admin/users?q=Spammy");
  await page.getByLabel(/Suspension reason/).fill("Repeated scam messages");
  await page.getByRole("button", { name: "Suspend" }).click();
  await expect(page.getByText("Updated.")).toBeVisible();
  await page.goto("/admin/audit?action=user.suspend");
  await expect(page.getByRole("cell", { name: "user.suspend" }).first()).toBeVisible();

  await loginAs(page, "Spammy Sam");
  await page.goto("/candidate");
  await expect(page).toHaveURL(/\/suspended/);
  await expect(page.getByText("Repeated scam messages")).toBeVisible();

  await loginAs(page, "Pilot Analyst");
  await page.goto("/admin/reports");
  await expect(page).toHaveURL(/\/admin\?denied=1/);
  const csv = await page.request.get("/admin/export/metrics");
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(await csv.text()).toContain("Interview rate %");

  await loginAs(page, "Verification Desk");
  expect((await page.request.get("/admin/export/jobs")).status()).toBe(403);
});

test("moderators approve a held listing in bulk view", async ({ page }) => {
  await loginAs(page, "Platform Admin");
  await page.goto("/admin/jobs?status=flagged");
  await expect(page.getByText("Helper urgently")).toBeVisible();
  await page.getByLabel("Select Helper urgently").check();
  await page.getByLabel("Reason").fill("Asked candidates for a fee");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText(/Updated 1 listing/)).toBeVisible();
});

test("cron endpoint requires the secret", async ({ request }) => {
  expect((await request.get("/api/cron/housekeeping")).status()).toBe(401);
  const ok = await request.get("/api/cron/housekeeping", { headers: { authorization: "Bearer e2e-cron-secret" } });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toHaveProperty("checkins");
});
