import { expect, test } from "@playwright/test";
import { createUser, completeProfile, loginAs } from "./helpers";

test("data export and permanent deletion", async ({ page }) => {
  await createUser(page, "Leaving Lakshmi", "candidate");
  await completeProfile(page, { district: "Ajmer" });

  const res = await page.request.get("/account/export");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-disposition"]).toContain("attachment");
  const data = await res.json();
  expect(data.account.name).toBe("Leaving Lakshmi");
  expect(data.candidate_profile.district).toBe("Ajmer");

  await page.goto("/account");
  await page.getByLabel("Type DELETE to confirm").fill("nope");
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByText("Type DELETE to confirm.")).toBeVisible();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page).toHaveURL(/\/\?deleted=1/);
  await expect(page.getByText("Your account and data have been deleted.")).toBeVisible();

  await page.goto("/dev-login");
  await expect(page.getByText("Leaving Lakshmi")).toHaveCount(0);
});

test("notification preferences and visibility are saved", async ({ page }) => {
  await loginAs(page, "Ravi Meena");
  await page.goto("/account");
  await page.getByLabel(/^SMS/).check();
  await page.locator("label.chip", { hasText: "हिन्दी" }).click();
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("सेटिंग सेव हो गई।")).toBeVisible();
  await expect(page.getByLabel(/^SMS/)).toBeChecked();
});
