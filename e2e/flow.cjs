// End-to-end smoke test (needs a fresh DB, auth bypass on, a running server and Playwright resolvable via NODE_PATH).
const { chromium } = require('playwright');
const S = (process.env.SHOTS_DIR || '/tmp/rk-shots') + '/';
require('fs').mkdirSync(S, { recursive: true });
const B = process.env.BASE_URL || 'http://localhost:3100';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console ' + m.text()); });
  const step = async (n) => console.log('✓', n);

  await page.goto(B + '/'); await page.screenshot({ path: S + '01-home.png', fullPage: true }); await step('home');
  await page.goto(B + '/jobs'); await page.screenshot({ path: S + '02-jobs.png', fullPage: true }); await step('jobs');
  await page.goto(B + '/jobs/1'); await page.screenshot({ path: S + '03-job.png', fullPage: true }); await step('job detail');

  // candidate flow: log in as Ravi (no, use Mahendra id 10?) -> pick via dev-login
  await page.goto(B + '/dev-login'); await page.screenshot({ path: S + '04-devlogin.png', fullPage: true });
  // new test candidate through full onboarding
  await page.fill('input[name=name]', 'Test Candidate'); await page.fill('input[name=phone]', '+919876543210');
  await page.click('text=Create & continue'); await page.waitForURL('**/candidate/profile'); await step('new candidate -> profile');
  await page.selectOption('select[name=district]', 'Barmer');
  await page.click('label.chip:has-text("Marwari")'); await page.click('label.tile:has-text("I want a job")');
  await page.click('label.chip:has-text("Surat")'); await page.click('label.chip:has-text("Men\'s clothing")');
  await page.screenshot({ path: S + '05-profile.png', fullPage: true });
  await page.click('button:has-text("Save & find work")'); await page.waitForURL(/candidate(\?|$)/); await step('profile saved -> ' + page.url());
  await page.screenshot({ path: S + '06-candidate-dash.png', fullPage: true });
  await page.goto(B + '/jobs/3'); await page.fill('textarea[name=message]', 'Please consider me.');
  await page.click('button:has-text("Apply now")'); await page.waitForSelector('text=Application sent'); await step('applied');
  await page.screenshot({ path: S + '07-applied.png' });
  await page.goto(B + '/jobs/1/report'); await page.fill('textarea[name=details]', 'Test report about the listing terms.');
  await page.click('button:has-text("Submit report")'); await page.waitForSelector('text=Thank you'); await step('reported');

  // employer: Balaji (employer 2 owner). find via dev-login
  await page.goto(B + '/dev-login');
  await page.locator('li:has-text("Sunil Maheshwari") button').click(); await page.waitForURL('**/employer'); await step('employer dash');
  await page.screenshot({ path: S + '08-employer.png', fullPage: true });
  await page.goto(B + '/employer/jobs/3'); await page.screenshot({ path: S + '09-applicants.png', fullPage: true });
  const sel = page.locator('form:has(select[name=status])').first();
  await sel.locator('select[name=status]').selectOption('selected'); await sel.locator('input[name=employer_note]').fill('Join Monday');
  await sel.locator('button:has-text("Update")').click(); await page.waitForURL('**updated=**'); await step('status updated');
  await page.goto(B + '/employer/jobs/new'); await page.screenshot({ path: S + '10-newjob.png', fullPage: true });
  await page.fill('input[name=title]', 'E2E Test Role'); await page.fill('input[name=salary_min]', '10000'); await page.fill('input[name=hours]', '9-6');
  await page.check('input[name=no_deductions]'); await page.click('button:has-text("Publish listing")');
  await page.waitForURL(/employer\/jobs\/\d+\?posted=1/); await step('job posted ' + page.url());
  // validation error path
  await page.goto(B + '/employer/jobs/new'); await page.fill('input[name=title]', 'Bad'); await page.fill('input[name=salary_min]', '10000'); await page.fill('input[name=hours]', 'x');
  await page.click('button:has-text("Publish listing")'); await page.waitForSelector('text=State all deductions'); await step('validation works');

  // admin
  await page.goto(B + '/dev-login'); await page.locator('li:has-text("Platform Admin") button').click(); await page.waitForURL('**/admin'); await step('admin');
  await page.screenshot({ path: S + '11-admin.png', fullPage: true });
  await page.goto(B + '/admin/employers'); await page.screenshot({ path: S + '12-admin-emp.png', fullPage: true });
  const card = page.locator('div', { has: page.locator('a', { hasText: 'Mewar Jewellers' }) }).filter({ has: page.locator('form') }).last();
  await card.locator('input[value=business]').check(); await card.locator('input[value=address]').check();
  await card.locator('button:has-text("Verify")').click(); await page.waitForURL('**done=1'); await step('verified employer');
  await page.goto(B + '/admin/reports'); await page.screenshot({ path: S + '13-admin-reports.png', fullPage: true });

  // candidate sees feedback
  await page.goto(B + '/dev-login'); await page.locator('li:has-text("Test Candidate") button').last().click(); await page.waitForURL('**/candidate');
  await page.goto(B + '/candidate'); await page.screenshot({ path: S + '14-cand-after.png', fullPage: true });
  await page.click('text=Share feedback'); await page.click('label.chip:has-text("★★★★★")'); await page.click('button:has-text("Submit feedback")');
  await page.waitForSelector('text=Thank you'); await step('feedback');

  // mobile + hindi
  const m = await browser.newContext({ viewport: { width: 390, height: 844 } }); const mp = await m.newPage();
  await mp.goto(B + '/'); await mp.click('button[aria-label="हिन्दी"]'); await mp.waitForTimeout(500);
  await mp.screenshot({ path: S + '15-mobile-hi.png', fullPage: true });
  await mp.goto(B + '/jobs/1'); await mp.screenshot({ path: S + '16-mobile-job.png', fullPage: true });
  console.log('ERRORS:', errors);
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
