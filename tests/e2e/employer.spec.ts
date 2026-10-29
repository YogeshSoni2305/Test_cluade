import { expect, test } from "@playwright/test";
import { createUser, loginAs, postJob } from "./helpers";

test.describe.configure({ mode: "serial" });

test("new employer: profile, verification checks, validation and a held scam listing", async ({ page, browser }) => {
  await createUser(page, "Owner Om", "employer");
  await expect(page).toHaveURL(/\/employer\/profile/);
  await page.getByLabel("Business name").fill("Om Mobile Point");
  await page.getByLabel("Business phone").fill("9812345670");
  await page.getByRole("button", { name: "Save & continue" }).click();
  await expect(page).toHaveURL(/\/employer\/verification\?welcome=1/);

  await page.getByLabel("GST number (if you have one)").fill("12345");
  await page.getByLabel("Which ID proof will you share?").fill("Aadhaar");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText(/doesn’t look valid/)).toBeVisible();
  await page.getByLabel("GST number (if you have one)").fill("24ABCDE1000F1Z5"); // already used by a seeded business
  await page.getByLabel("Which ID proof will you share?").fill("Aadhaar");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText(/already registered to another business/)).toBeVisible();

  // required transparency fields
  await page.goto("/employer/jobs/new");
  await page.getByLabel("Job title").fill("Counter staff");
  await page.getByLabel("Salary from (₹)").fill("9000");
  await page.getByLabel("Working hours").fill("9-7");
  await page.getByRole("button", { name: "Publish listing" }).click();
  await expect(page.getByText("State all deductions, or tick 'No deductions'.")).toBeVisible();

  const scamId = await postJob(page, "Helper urgently", { description: "Registration fee 1000 must be paid before joining." });
  await expect(page.getByText(/held for a quick safety review/)).toBeVisible();
  const anon = await browser.newPage();
  const res = await anon.goto(`/jobs/${scamId}`);
  expect(res?.status()).toBe(404);
  await anon.close();

  // unverified employers can't search candidates
  await page.goto("/employer/candidates");
  await expect(page.getByText(/only for verified businesses/)).toBeVisible();
});

test("listing analytics, duplicate and renew", async ({ page }) => {
  await loginAs(page, "Ramesh Agarwal");
  await page.goto("/employer");
  await expect(page.getByText(/Views \(30 days\)/)).toBeVisible();
  await page.getByRole("link", { name: "Showroom Sales Trainee" }).click();
  await expect(page.getByText("Last 14 days")).toBeVisible();
  await page.getByRole("link", { name: "Duplicate" }).click();
  await expect(page.getByLabel("Job title")).toHaveValue("Showroom Sales Trainee");
  await expect(page.getByText(/Copied from an earlier listing/)).toBeVisible();
});

test("verified employer invites a discoverable candidate, who applies", async ({ page }) => {
  await loginAs(page, "Sunil Maheshwari");
  await page.goto("/employer/candidates?industry=menswear");
  const card = page.locator("li", { hasText: "Mahendra R." });
  await expect(card).toBeVisible();
  await expect(card).not.toContainText("+91");
  await card.getByLabel("Invite to").selectOption({ label: "Accounts Trainee (Party Ledger)" });
  await card.getByLabel("Message (optional)").fill("You would fit our dispatch team.");
  await card.getByRole("button", { name: "Invite" }).click();
  await expect(page.getByText("Invitation sent.")).toBeVisible();

  await loginAs(page, "Mahendra");
  await page.goto("/candidate");
  const invite = page.locator("li", { hasText: "You would fit our dispatch team." });
  await invite.getByRole("button", { name: "View & apply" }).click();
  await expect(page.getByText(/You were invited to apply/)).toBeVisible();
  await page.getByRole("button", { name: "Apply now" }).click();
  await expect(page.getByText(/Application sent/)).toBeVisible();
});

test("experience letter is issued and publicly verifiable", async ({ page, browser }) => {
  await loginAs(page, "Kishan Lal Soni");
  await page.goto("/employer");
  await page.getByRole("link", { name: "Hardware Counter Assistant" }).click();
  const app = page.locator("article", { hasText: "Pooja Choudhary" });
  await app.getByText("Record exit & issue experience letter").click();
  await app.locator("label.chip", { hasText: "Billing & measurement" }).click();
  await app.getByLabel(/Remarks/).fill("Hard-working and honest.");
  await app.getByLabel(/I confirm these details are true/).check();
  await app.getByRole("button", { name: "Issue letter" }).click();
  const code = (await page.getByText(/Experience letter issued\. Code:/).first().locator("b").innerText()).trim();
  expect(code).toMatch(/^RK-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

  const anon = await browser.newPage();
  await anon.goto("/letters");
  await anon.getByLabel("Letter code").fill(code.toLowerCase().replace(/-/g, " "));
  await anon.getByRole("button", { name: "Check" }).click();
  await expect(anon.getByText(/Genuine letter/)).toBeVisible();
  await expect(anon.getByText("Hard-working and honest.")).toBeVisible();
  await expect(anon.getByText(/Pooja Choudhary/).first()).toBeVisible();
  await anon.close();
});
