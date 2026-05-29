const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. 打开首页
  await page.goto('http://127.0.0.1:5179/');
  await page.waitForTimeout(1000);

  // 2. 点击登录
  await page.click('text=登录');
  await page.waitForTimeout(500);

  // 3. 填写账号密码 (chenmo 是理性消费展示用户)
  await page.fill('input[placeholder*="用户名"], input[name="username"], #username', 'chenmo');
  await page.fill('input[placeholder*="密码"], input[name="password"], input[type="password"]', '123456');
  await page.click('button:has-text("登录"), button[type="submit"]');
  await page.waitForTimeout(2000);

  // 4. 导航到理性消费页面
  await page.goto('http://127.0.0.1:5179/rational-consumption');
  await page.waitForTimeout(2000);

  // 5. 截图
  await page.screenshot({ path: 'uploads/screenshots/rational-consumption.png', fullPage: true });
  console.log('截图已保存到 uploads/screenshots/rational-consumption.png');

  await browser.close();
})();
