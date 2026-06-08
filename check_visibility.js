import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000));
  
  const textCheck = await page.evaluate(() => {
     const elements = Array.from(document.querySelectorAll('*'));
     const texts = elements.map(el => el.textContent?.trim()).filter(t => t && t.length > 5);
     const header = document.querySelector('header');
     const nav = document.querySelector('nav');
     return {
        hasHeader: !!header,
        headerRect: header ? header.getBoundingClientRect().toJSON() : null,
        hasNav: !!nav,
        navRect: nav ? nav.getBoundingClientRect().toJSON() : null,
        someTexts: texts.slice(0, 10)
     }
  });
  console.log(JSON.stringify(textCheck, null, 2));
  await browser.close();
})();
