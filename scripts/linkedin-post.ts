import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_PERSON_URN = process.env.LINKEDIN_PERSON_URN; // e.g. urn:li:person:xxxxx

async function postToLinkedIn(text: string) {
  if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_PERSON_URN) {
    console.error('Missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_PERSON_URN in .env.local');
    process.exit(1);
  }

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: LINKEDIN_PERSON_URN,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('LinkedIn API error:', error);
    process.exit(1);
  }

  const result = await response.json();
  console.log('Posted successfully! Post ID:', result.id);
}

const text = process.argv[2];
if (!text) {
  console.error('Usage: tsx scripts/linkedin-post.ts "Your post text here"');
  process.exit(1);
}

postToLinkedIn(text);
