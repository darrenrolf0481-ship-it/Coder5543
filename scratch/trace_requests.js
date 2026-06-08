import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  page.on('console', msg => console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`));
  
  page.on('request', request => {
    console.log(`[REQ] ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    console.log(`[RES] ${response.status()} ${response.url()} (${response.headers()['content-type'] || 'unknown'})`);
  });

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Navigation complete.');
  } catch (err) {
    console.error('Navigation error:', err.message);
  } finally {
    await browser.close();
  }
})();
