import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', response => {
    console.log(`[${response.status()}] ${response.url()}`);
  });
  
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  await browser.close();
})();
