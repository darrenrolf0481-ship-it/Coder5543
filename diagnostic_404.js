import puppeteer from 'puppeteer';

(async () => {
  const targetUrl = process.argv[2] || `http://localhost:${process.env.PORT || '3002'}`;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[CONSOLE ERROR]', msg.text());
  });

  page.on('response', response => {
    if (response.status() === 404) {
      console.log('[404 ERROR]', response.url());
    }
  });

  try {
    console.log(`Loading ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });
    const dimensions = await page.evaluate(() => {
      const root = document.getElementById('root');
      const firstChild = root ? root.firstElementChild : null;
      return {
        rootOffsetHeight: root ? root.offsetHeight : 0,
        rootOffsetWidth: root ? root.offsetWidth : 0,
        firstChildDisplay: firstChild ? getComputedStyle(firstChild).display : 'none',
        firstChildOpacity: firstChild ? getComputedStyle(firstChild).opacity : '0',
        firstChildVisibility: firstChild ? getComputedStyle(firstChild).visibility : 'hidden',
        color: firstChild ? getComputedStyle(firstChild).color : 'n/a'
      };
    });
    console.log('--- DIMENSIONS ---');
    console.log(JSON.stringify(dimensions, null, 2));
  } finally {
    await browser.close();
  }
})();
