import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));

  const hasTailwind = await page.evaluate(() => {
    const el = document.querySelector('.bg-\\[\\#0a0202\\]');
    if (!el) return 'No element found with Tailwind class';
    const style = window.getComputedStyle(el);
    return `Background color: ${style.backgroundColor}`;
  });
  console.log('TAILWIND CHECK:', hasTailwind);

  await browser.close();
})();
