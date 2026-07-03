const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const url = process.argv[2] || 'http://localhost:3002/';

  const logs = [];
  const errors = [];
  const failedReqs = [];
  const apiCalls = [];

  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
  page.on('requestfailed', (r) =>
    failedReqs.push(`FAILED ${r.method()} ${r.url()} :: ${r.failure()?.errorText}`),
  );
  page.on('response', (r) => {
    const u = r.url();
    if (u.includes('/api/')) apiCalls.push(`${r.status()} ${r.request().method()} ${u.replace(/^https?:\/\/[^/]+/, '')}`);
  });

  await page.setViewport({ width: 1400, height: 900 });
  console.log(`Loading ${url} ...`);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    console.log('GOTO ERROR:', e.message);
  }
  await new Promise((r) => setTimeout(r, 4000));

  // Is root populated?
  const rootInfo = await page.evaluate(() => {
    const root = document.getElementById('root');
    const splash = document.getElementById('splash');
    return {
      rootChildCount: root ? root.childElementCount : -1,
      rootHTMLlen: root ? root.innerHTML.length : -1,
      splashPresent: !!splash,
      bodyText: (document.body.innerText || '').slice(0, 400),
      title: document.title,
    };
  });

  console.log('\n=== ROOT ===');
  console.log(JSON.stringify(rootInfo, null, 2));
  console.log('\n=== PAGE ERRORS ===');
  console.log(errors.length ? errors.join('\n') : '(none)');
  console.log('\n=== FAILED REQUESTS ===');
  console.log(failedReqs.length ? failedReqs.join('\n') : '(none)');
  console.log('\n=== API CALLS ===');
  console.log(apiCalls.length ? apiCalls.join('\n') : '(none)');
  console.log('\n=== CONSOLE (last 30) ===');
  console.log(logs.slice(-30).join('\n'));

  await page.screenshot({ path: 'diag_live.png', fullPage: false });
  console.log('\nscreenshot -> diag_live.png');
  await browser.close();
})();
