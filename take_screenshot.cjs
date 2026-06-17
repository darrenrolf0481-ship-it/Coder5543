const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const targetUrl = process.argv[2] || `http://localhost:${process.env.PORT || '3002'}`;

  await page.setViewport({ width: 1280, height: 800 });
  console.log(`Loading ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: 'scr.png' });
  await browser.close();
})();
