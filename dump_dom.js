import puppeteer from 'puppeteer';

(async () => {
  const targetUrl = process.argv[2] || `http://localhost:${process.env.PORT || '3002'}`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  console.log(`Loading ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const rootHtml = await page.$eval('#root', el => el.innerHTML);
  console.log("ROOT HTML LENGTH:", rootHtml.length);
  if (rootHtml.length < 1000) {
      console.log("ROOT HTML CONTENT:", rootHtml);
  } else {
      console.log("ROOT HTML (truncated):", rootHtml.substring(0, 1000));
  }
  
  const bodyStyle = await page.$eval('body', el => el.style.cssText);
  console.log("BODY STYLE:", bodyStyle);
  
  const appVisibility = await page.evaluate(() => {
     const el = document.querySelector('#root > div');
     if (!el) return 'Element not found';
     const style = window.getComputedStyle(el);
     return `opacity: ${style.opacity}, display: ${style.display}, visibility: ${style.visibility}`;
  });
  console.log("APP VISIBILITY:", appVisibility);

  await browser.close();
})();
