require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { generateQuoteCard } = require('../src/utils/imageGenerator');

const testQuote = {
  id: 1,
  title: "Daily Motivation",
  quote: "The secret of getting ahead is getting started.",
  subtitle: "Stop waiting for the perfect moment and take action today."
};

(async () => {
  console.log('Generating test card...');
  const buffer = await generateQuoteCard(testQuote);
  const outPath = path.join(__dirname, '../test_output.png');
  fs.writeFileSync(outPath, buffer);
  console.log('Done! Saved to:', outPath);
})();
