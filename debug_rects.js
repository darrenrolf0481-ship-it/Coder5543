import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 6500)); // wait past 6s splash timeout

  const layout = await page.evaluate(() => {
    const root = document.getElementById('root').getBoundingClientRect().toJSON();
    const app = document.querySelector('#root > div').getBoundingClientRect().toJSON();
    const header = document.querySelector('header')?.getBoundingClientRect().toJSON();
    const splash =
      document.getElementById('splash')?.getBoundingClientRect().toJSON() || 'NO_SPLASH';
    return { root, app, header, splash };
  });
  console.log('LAYOUT:', JSON.stringify(layout, null, 2));

  await browser.close();
})();
