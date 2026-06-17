const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));

  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      console.log(`RESOURCE ERROR [${status}]: ${response.url()}`);
    }
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  } catch (e) {
    console.log('GOTO ERROR:', e.message);
  }
  await browser.close();
})();
