const puppeteer = require('puppeteer');

(async () => {
  const targetUrl = process.argv[2] || `http://localhost:${process.env.PORT || '3002'}`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));
  try {
    console.log(`Loading ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 10000 });
  } catch (e) {
    console.log('GOTO ERROR:', e.message);
  }
  await browser.close();
})();
