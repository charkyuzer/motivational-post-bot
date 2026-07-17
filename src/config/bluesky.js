const { BskyAgent } = require('@atproto/api');

const handle = process.env.BLUESKY_HANDLE;
const appPassword = process.env.BLUESKY_APP_PASSWORD;
const hasCredentials = handle && appPassword;

let agent = null;
let isMockMode = !hasCredentials;

async function initialize() {
  if (!hasCredentials) {
    console.warn('Bluesky credentials missing. Running in Mock Mode.');
    isMockMode = true;
    return;
  }
  try {
    agent = new BskyAgent({ service: 'https://bsky.social' });
    await agent.login({ identifier: handle, password: appPassword });
    console.log(`Successfully logged in to Bluesky as @${handle}`);
    isMockMode = false;
  } catch (error) {
    console.error('Failed to login to Bluesky:', error.message);
    isMockMode = true;
    agent = null;
  }
}

async function post(text, embed = null) {
  if (isMockMode || !agent) {
    console.log(`[MOCK POST] "${text}"`);
    return { uri: `mock_post_${Date.now()}`, cid: `mock_cid_${Date.now()}` };
  }
  const postData = { text, createdAt: new Date().toISOString() };
  if (embed) postData.embed = embed;
  return await agent.post(postData);
}

async function uploadBlob(buffer, mimeType = 'image/png') {
  if (isMockMode || !agent) {
    console.log(`[MOCK BLOB] ${buffer.length} bytes`);
    return { data: { blob: { $type: 'blob', ref: { $link: `mock_${Date.now()}` }, mimeType, size: buffer.length } } };
  }
  return await agent.uploadBlob(buffer, { encoding: mimeType });
}

function isInMockMode() { return isMockMode; }

module.exports = { initialize, post, uploadBlob, isInMockMode };
