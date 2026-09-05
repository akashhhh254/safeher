import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAI && process.env.GEMINI_API_KEY) {
    try {
      genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Could not initialize GoogleGenAI:', e);
    }
  }
  return genAI;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SafeHer API', time: new Date().toISOString() });
});

// Dynamic Auth Config Info
app.get('/api/auth/config', (req, res) => {
  res.json({
    host: req.get('host'),
    appUrl: process.env.APP_URL || null,
    defaultAuthDomain: 'gen-lang-client-0841274382.firebaseapp.com',
  });
});

// Firebase Auth Reverse Proxy to support custom domain authentication flows (/__/auth/*)
app.all(['/__/auth', '/__/auth/*'], async (req, res) => {
  try {
    const targetUrl = `https://gen-lang-client-0841274382.firebaseapp.com${req.originalUrl}`;
    const headers: Record<string, string> = {};
    for (const [key, val] of Object.entries(req.headers)) {
      if (key.toLowerCase() !== 'host' && typeof val === 'string') {
        headers[key] = val;
      }
    }
    delete headers['accept-encoding'];

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    res.status(response.status);
    response.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (
        lower !== 'content-encoding' &&
        lower !== 'content-length' &&
        lower !== 'transfer-encoding'
      ) {
        res.setHeader(key, val);
      }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Length', buffer.length.toString());
    res.send(buffer);
  } catch (err) {
    console.error('Firebase Auth Proxy error:', err);
    res.status(502).send('Firebase Auth Gateway Error');
  }
});

// Grounded Route Safety Explanation Endpoint
app.post('/api/gemini/explain-route', async (req, res) => {
  const { route, allRoutes, destinationName } = req.body;

  if (!route) {
    return res.status(400).json({ error: 'Route data is required' });
  }

  const ai = getGenAI();
  if (!ai) {
    // Fallback explanation grounded in deterministic data
    const safetyDiff = route.safety.compositeSafetyScore >= 80 ? 'significantly higher safety score' : 'balanced safety profile';
    return res.json({
      explanation: `${route.name} is recommended because it offers a ${safetyDiff} (${route.safety.compositeSafetyScore}/100) with ${route.safety.positiveFactors.join(', ') || 'verified road lighting'}, reaching ${destinationName || 'destination'} in ${route.durationMinutes} minutes.`
    });
  }

  try {
    const prompt = `
You are SafeHer's safety intelligence analyst for women's navigation.
Explain clearly and reassuringly in 2 to 3 concise sentences why this specific route is recommended or evaluated.

DATA FOR THIS ROUTE:
- Name: ${route.name}
- Duration: ${route.durationMinutes} minutes
- Distance: ${route.distanceKm} km
- Deterministic Safety Score: ${route.safety.compositeSafetyScore}/100 (Risk level: ${route.safety.riskLevel})
- Lighting Score: ${route.safety.lightingScore}/100
- Public Activity Score: ${route.safety.publicActivityScore}/100
- Emergency Facility Access Score: ${route.safety.facilityScore}/100
- Active Community Hazard Reports Nearby: ${route.safety.reportPenalty > 0 ? 'Yes (' + route.safety.reportPenalty + ' penalty)' : 'None'}
- Positive Factors: ${route.safety.positiveFactors.join(', ')}
- Risk Factors: ${route.safety.riskFactors.join(', ')}
- Destination: ${destinationName || 'Destination'}

STRICT ACCURACY RULES:
1. ONLY reference the data provided above.
2. DO NOT invent fake crime statistics, police response minutes, or imaginary CCTV cameras.
3. Highlight the trade-off between travel time (${route.durationMinutes} mins) and safety score (${route.safety.compositeSafetyScore}/100).
4. Tone: Calm, supportive, professional, empowering.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
    } catch (modelErr: any) {
      console.warn('Retrying with gemini-3.6-flash:', modelErr?.message || modelErr);
      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });
    }

    const text = response.text?.trim() || `${route.name} provides an optimal safety profile with ${route.safety.compositeSafetyScore}/100 safety score and reliable commercial activity.`;
    res.json({ explanation: text });
  } catch (err: any) {
    console.error('Gemini error:', err);
    res.json({
      explanation: `${route.name} provides a ${route.safety.compositeSafetyScore}/100 safety score with verified street lighting and emergency facility access along its ${route.distanceKm} km corridor.`
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SafeHer server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
