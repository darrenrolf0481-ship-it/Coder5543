import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', error => console.log('ERR:', error.message));
  page.on('requestfailed', request => console.log('REQ_FAIL:', request.url(), request.failure()?.errorText));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000)); // Wait for splash to fade
  
  const rootContent = await page.$eval('#root', el => el.innerHTML);
  console.log("--- ROOT HTML ---");
  console.log(rootContent.substring(0, 1500));
  
  await page.screenshot({ path: 'debug_screen.png' });
  await browser.close();
})();
