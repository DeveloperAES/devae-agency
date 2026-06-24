const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const urls = [
    { url: 'https://ysique.com/', file: 'public/projects/ysique.png' },
    { url: 'https://oigperu.com.pe/', file: 'public/projects/oigperu.png' },
    { url: 'https://andersonv9.sg-host.com/', file: 'public/projects/andersonv9.png' }
  ];

  for (const item of urls) {
    console.log('Taking screenshot of ' + item.url);
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    try {
      await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.screenshot({ path: item.file });
      console.log('Saved ' + item.file);
    } catch (e) {
      console.error('Failed ' + item.url, e);
    }
    await page.close();
  }

  await browser.close();
})();
