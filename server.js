const express = require('express');
const path = require('path');
const { chromium } = require('playwright');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function normalizeUrl(value) {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    throw new Error('Ссылка обязательна');
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

app.post('/api/preview', async (req, res) => {
  try {
    const rawUrl = req.body?.url;
    const url = normalizeUrl(rawUrl);

    const browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    const title = await page.title();
    const screenshot = await page.screenshot({
      fullPage: true,
      type: 'png',
    });

    await browser.close();

    res.json({
      title,
      url,
      image: `data:image/png;base64,${screenshot.toString('base64')}`,
    });
  } catch (error) {
    console.error('[ERROR] /api/preview:', error.message);
    res.status(500).json({
      error: 'Не удалось загрузить страницу. Проверьте ссылку или доступность сайта.',
      details: error.message,
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Nuurayteams' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Nuurayteams started on http://localhost:${PORT}`);
});
