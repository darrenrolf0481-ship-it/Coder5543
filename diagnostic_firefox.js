import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/firefox',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', (msg) => logs.push(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[PAGE ERROR]: ${err.message}`));
  page.on('requestfailed', (request) =>
    logs.push(
      `[NET ERROR]: ${request.failure() ? request.failure().errorText : 'failed'} ${request.url()}`,
    ),
  );

  console.log('Loading http://localhost:3001...');
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait a bit for potential async crashes
    await new Promise((r) => setTimeout(r, 2000));

    const data = await page.evaluate(() => {
      const errorLog = document.getElementById('error-log');
      const splash = document.getElementById('splash');
      const root = document.getElementById('root');

      return {
        errorLogContent: errorLog ? errorLog.innerText : 'not found',
        errorLogVisible: errorLog ? errorLog.style.height === '100vh' : false,
        splashExists: !!splash,
        splashOpacity: splash ? getComputedStyle(splash).opacity : 'n/a',
        rootHtml: root ? root.innerHTML.substring(0, 200) : 'not found',
        bodyBg: getComputedStyle(document.body).backgroundColor,
        visibility: getComputedStyle(document.body).visibility,
      };
    });

    console.log('--- BROWSER LOGS ---');
    logs.forEach((l) => console.log(l));
    console.log('--- DOM STATE ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('DIAGNOSTIC FAILED:', err.message);
  } finally {
    await browser.close();
  }
})();
