import { expect, test } from "@playwright/test";
import { createUser, completeProfile, loginAs, postJob } from "./helpers";

test.describe.configure({ mode: "serial" });

test("new candidate completes the one-question-at-a-time profile", async ({ page }) => {
  await createUser(page, "Simple Sita", "candidate");
  await expect(page).toHaveURL(/\/candidate\/profile/);
  await expect(page.getByText("What is your name?")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  // the district step validates before moving on
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Please choose your district.")).toBeVisible();
  await page.getByLabel("Which district in Rajasthan are you from?").selectOption("Sikar");
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("label.tile", { hasText: "12th pass" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("label.tile", { hasText: "I want to learn a trade" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("label.tile", { hasText: "Jewellery retail" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("label.tile", { hasText: "Bengaluru" }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next" }).click();
  // a double-tap on the last "Next" must not submit the form before the final question is answered
  await page.getByRole("button", { name: "Next" }).dblclick();
  await expect(page.getByText("Can verified employers find your profile?")).toBeVisible();
  await expect(page).toHaveURL(/\/candidate\/profile/);
  await page.locator("fieldset:visible label.tile", { hasText: "Yes" }).click();
  await page.waitForTimeout(450); // the guard ignores a Save tap within 400 ms of arriving on the step
  await page.getByRole("button", { name: "Save & find work" }).click();
  await expect(page).toHaveURL(/\/candidate\?saved=1/);
  await expect(page.getByText("Profile saved.")).toBeVisible();
  await page.goto("/account");
  await expect(page.getByLabel(/Let verified employers find me/)).toBeChecked();
});

test("apply keeps the phone hidden, then chat and masked-call request work", async ({ page }) => {
  await createUser(page, "Chat Chandan", "candidate");
  await completeProfile(page);
  await page.goto("/jobs?industry=menswear&city=Surat");
  await page.getByRole("link", { name: /Showroom Sales Trainee/ }).first().click();
  await page.getByPlaceholder(/A line to the owner/).fill("Namaste, I can join next week.");
  await page.getByRole("button", { name: "Apply now" }).click();
  await expect(page.getByText(/Application sent/)).toBeVisible();

  await page.getByRole("link", { name: "Message", exact: true }).click();
  await expect(page.getByText("Namaste, I can join next week.")).toBeVisible();
  await expect(page.getByText(/Your number is hidden/)).toBeVisible();
  await page.getByLabel("Write a message…").fill("Is the stay close to the shop?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Is the stay close to the shop?")).toBeVisible();
  // sending the same text again (a double tap, or spam) is refused
  await page.getByLabel("Write a message…").fill("Is the stay close to the shop?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/already sent this message/)).toBeVisible();
  await expect(page.getByText("Is the stay close to the shop?", { exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Call with number hidden" }).click();
  await expect(page.getByText(/Call request sent/)).toBeVisible();
  const thread = page.url().split("?")[0];

  // employer sees a masked number and the chat
  await loginAs(page, "Ramesh Agarwal");
  await page.goto(thread);
  await expect(page.getByText(/\+91 ••••• ••\d{3}/)).toBeVisible();
  await page.getByLabel("Write a message…").fill("Yes, 5 minutes walk.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Yes, 5 minutes walk.")).toBeVisible();

  // candidate gets an unread badge and a notification
  await loginAs(page, "Chat Chandan");
  await expect(page.getByRole("link", { name: /Messages \(1\)/ })).toBeVisible();
});

test("scam messages are delivered with a warning", async ({ page }) => {
  await loginAs(page, "Mahendra");
  await page.goto("/messages");
  await page.locator("main li a", { hasText: "Shree Ram Menswear" }).click();
  await page.getByLabel("Write a message…").fill("Please send registration fee 500 on gpay");
  await page.getByRole("button", { name: "Send" }).click();
  const thread = page.url();
  await loginAs(page, "Ramesh Agarwal");
  await page.goto(thread);
  await expect(page.getByText(/Never pay anyone to get a job/)).toBeVisible();
});

test("job alerts notify when a matching job is posted", async ({ page }) => {
  await createUser(page, "Alert Arjun", "candidate");
  await completeProfile(page, { industry: "Hardware", city: "Indore" });
  await page.goto("/jobs?industry=hardware&city=Indore");
  await page.getByRole("button", { name: "Notify me" }).click();
  await expect(page.getByText(/Alert saved/)).toBeVisible();

  await loginAs(page, "Kishan Lal Soni");
  await postJob(page, "Paint Counter Helper");

  await loginAs(page, "Alert Arjun");
  await page.goto("/notifications");
  await expect(page.getByText("New job: Paint Counter Helper")).toBeVisible();
  await page.getByText("New job: Paint Counter Helper").click();
  await expect(page.getByRole("heading", { level: 1, name: "Paint Counter Helper" })).toBeVisible();
  await page.goto("/candidate/alerts");
  await expect(page.getByText(/Hardware & building materials · in Indore/)).toBeVisible();
});
