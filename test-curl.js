// Test script to debug curl parsing
const curl2Json = require('@bany/curl-to-json').default;

const testCurls = [
  {
    name: "openai",
    curl: `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
  "model": "{{MODEL}}",
  "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}]}]
  }'`
  },
  {
    name: "nvidia-nim",
    curl: `curl https://integrate.api.nvidia.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
  "model": "{{MODEL}}",
  "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,{{IMAGE}}"}}]}]
  }'`
  },
  {
    name: "mistral",
    curl: `curl https://api.mistral.ai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
  "model": "{{MODEL}}",
  "messages": [{"role": "system", "content": "{{SYSTEM_PROMPT}}"}, {"role": "user", "content": [{"type": "text", "text": "{{TEXT}}"}, {"type": "image_url", "image_url": "data:image/png;base64,{{IMAGE}}"}]}]
  }'`
  }
];

for (const test of testCurls) {
  console.log(`\n=== Testing ${test.name} ===`);
  try {
    const result = curl2Json(test.curl);
    console.log('URL:', result.url);
    console.log('Method:', result.method);
    console.log('Headers:', JSON.stringify(result.header, null, 2));
    console.log('Data:', JSON.stringify(result.data, null, 2));
    console.log('SUCCESS');
  } catch (e) {
    console.log('ERROR:', e.message);
  }
}
