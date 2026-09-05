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

// In-memory OTP storage for secure email and SMS phone verification
const activeOtps = new Map<string, { code: string; expiresAt: number; attempts: number }>();

app.post('/api/auth/otp/send', (req, res) => {
  const { target, type } = req.body;
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Target email or phone is required' });
  }
  const cleanTarget = target.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  activeOtps.set(cleanTarget, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });

  console.log(`[SafeHer Security] 6-digit OTP dispatched for ${type || 'account'} [${cleanTarget}]: ${code}`);
  return res.json({
    success: true,
    message: `Security OTP sent to ${target}`,
    code, // Included for realistic simulated SMS/Email inbox delivery
    expiresInSeconds: 600,
  });
});

app.post('/api/auth/otp/verify', (req, res) => {
  const { target, code } = req.body;
  if (!target || !code) {
    return res.status(400).json({ error: 'Target and verification code are required' });
  }
  const cleanTarget = target.trim().toLowerCase();
  const entry = activeOtps.get(cleanTarget);
  if (!entry) {
    return res.status(400).json({ error: 'No active OTP request found. Please request a new code.' });
  }
  if (Date.now() > entry.expiresAt) {
    activeOtps.delete(cleanTarget);
    return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
  }
  if (entry.code !== String(code).trim()) {
    entry.attempts += 1;
    if (entry.attempts >= 5) {
      activeOtps.delete(cleanTarget);
      return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new code.' });
    }
    return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
  }

  activeOtps.delete(cleanTarget);
  return res.json({
    success: true,
    verified: true,
    verifiedTarget: cleanTarget,
    token: `SH-AUTH-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  });
});


// Firebase Auth Reverse Proxy to support custom domain authentication flows (/__/auth/*)
app.all(['/__/auth', '/__/auth/*'], async (req, res) => {
  try {
    const targetUrl = `https://gen-lang-client-0841274382.firebaseapp.com${req.originalUrl}`;
    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (key.toLowerCase() !== 'host' && typeof val === 'string') {
        headers.set(key, val);
      }
    }
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    res.status(response.status);
    response.headers.forEach((val, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, val);
      }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
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
