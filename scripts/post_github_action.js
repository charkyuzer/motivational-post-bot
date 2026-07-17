require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bluesky = require('../src/config/bluesky');
const { generateQuoteCard } = require('../src/utils/imageGenerator');

const QUOTES_FILE = path.join(__dirname, '../src/data/quotes.json');

async function run() {
  try {
    console.log('Starting Motivation Bot GitHub Actions Job...');

    if (!fs.existsSync(QUOTES_FILE)) {
      console.error('quotes.json not found at', QUOTES_FILE);
      process.exit(1);
    }

    const quotes = JSON.parse(fs.readFileSync(QUOTES_FILE, 'utf8'));

    // 45-min cooldown check
    const lastPosted = quotes
      .filter(q => q.posted_at)
      .sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at))[0];

    if (lastPosted) {
      const minutesSince = (Date.now() - new Date(lastPosted.posted_at)) / 60000;
      if (minutesSince < 45) {
        console.log(`Last post was ${minutesSince.toFixed(1)} min ago. Skipping.`);
        process.exit(0);
      }
    }

    // Find next unposted quote
    const nextIndex = quotes.findIndex(q => !q.posted);
    if (nextIndex === -1) {
      console.warn('All quotes have been posted!');
      process.exit(0);
    }

    const quote = quotes[nextIndex];
    console.log(`Selected Quote ID ${quote.id}: "${quote.quote}"`);

    // Init Bluesky
    await bluesky.initialize();
    if (bluesky.isInMockMode()) {
      console.error('Bluesky is in Mock Mode! Check BLUESKY_HANDLE and BLUESKY_APP_PASSWORD secrets.');
      process.exit(1);
    }

    // Generate image
    let embed = null;
    try {
      console.log('Generating image card...');
      const imageBuffer = await generateQuoteCard(quote);
      console.log('Uploading image...');
      const uploadRes = await bluesky.uploadBlob(imageBuffer, 'image/png');
      embed = {
        $type: 'app.bsky.embed.images',
        images: [{ alt: quote.title || 'Motivational Quote', image: uploadRes.data.blob }]
      };
      console.log('Image uploaded successfully.');
    } catch (imgErr) {
      console.error('Image generation failed, posting text only:', imgErr.message);
    }

    // Post text (minimal — image carries the content)
    const postText = `${quote.quote}\n\n- @tonymotivation.bsky.social`;
    const trimmed = postText.length > 300 ? quote.quote.substring(0, 297) + '...' : postText;

    const response = await bluesky.post(trimmed, embed);
    console.log('Post successful! URI:', response.uri);

    // Update quotes.json
    quotes[nextIndex].posted = true;
    quotes[nextIndex].posted_at = new Date().toISOString();
    fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2), 'utf8');
    console.log(`Updated quotes.json for quote ID ${quote.id}.`);

  } catch (err) {
    console.error('Fatal error:', err.stack);
    process.exit(1);
  }
}

run();
