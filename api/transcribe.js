export const config = {
  api: {
    bodyParser: { sizeLimit: '6mb' }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEYが設定されていません' });
  }

  const accessPassword = process.env.ACCESS_PASSWORD;
  if (accessPassword) {
    const provided = req.headers['x-access-password'];
    if (provided !== accessPassword) {
      return res.status(401).json({ error: 'パスワードが違います' });
    }
  }

  try {
    const { audioBase64, mimeType, filename } = req.body || {};
    if (!audioBase64) {
      return res.status(400).json({ error: '音声データがありません' });
    }

    const buffer = Buffer.from(audioBase64, 'base64');
    const blob = new Blob([buffer], { type: mimeType || 'audio/mpeg' });

    const formData = new FormData();
    formData.append('file', blob, filename || 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'ja');
    formData.append('response_format', 'verbose_json');

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
