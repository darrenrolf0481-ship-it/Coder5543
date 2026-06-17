const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', (request) =>
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText),
  );

  const targetUrl = process.argv[2] || `http://localhost:${process.env.PORT || '3002'}`;

  console.log(`Loading ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));
  await browser.close();
})();
