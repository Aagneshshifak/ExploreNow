import 'dotenv/config';
import fetch from 'node-fetch';

async function main() {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    console.error('No GROQ_API_KEY found in environment');
    process.exit(2);
  }

  console.log('Checking Groq API key...');

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    const text = await res.text();
    console.log('HTTP Status:', res.status);
    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response Text:', text);
    }

    if (!res.ok) process.exit(3);
  } catch (err) {
    console.error('Network error while contacting Groq:', err);
    process.exit(4);
  }
}

main();
