const axios = require('axios');
require('dotenv').config();

async function test() {
  const payload = {
    model: 'llama3-8b-8192',
    messages: [
      {
        role: 'user',
        content: `Act as the Bat-Computer. Return JSON.`
      }
    ],
    response_format: { type: 'json_object' }
  };

  try {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(res.data.choices[0].message.content);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
