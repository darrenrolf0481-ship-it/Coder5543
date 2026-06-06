import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:3000...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Page loaded. Reading select options...');
    
    const selectsData = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      return selects.map((sel, idx) => {
        return {
          index: idx,
          title: sel.getAttribute('title') || 'no title',
          className: sel.className,
          options: Array.from(sel.querySelectorAll('option')).map(opt => ({
            value: opt.getAttribute('value'),
            text: opt.innerText,
            selected: opt.selected
          }))
        };
      });
    });
    
    console.log('--- FOUND SELECT MENUS ---');
    console.log(JSON.stringify(selectsData, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
