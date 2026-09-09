const pdf = require('pdf-parse');

/**
 * Extracts raw text from a PDF Buffer
 */
async function extractTextFromPdf(pdfBuffer) {
  const data = await pdf(pdfBuffer);
  return data.text;
}

const FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.7-flash'
];

/**
 * Parses sermon text into structured slide items using Gemini AI with resilient multi-model fallback
 */
async function parseSermonWithGemini(sermonText, apiKey, preferredModel = null) {
  const prompt = `Você é um especialista em design de slides de pregação e culto para projeção em igreja e telões de LED.
Sua missão é transformar o texto/esboço de um sermão enviado pelo pastor em uma sequência de SLIDES INDIVIDUAIS estruturados em JSON, seguindo rigorosamente as seguintes REGRAS DE OURO:

### REGRAS DE OURO:
1. **QUEBRA DE VERSÍCULOS (1 VERSÍCULO POR SLIDE)**:
   - NUNCA coloque múltiplos versículos juntos em um único slide.
   - Se o pastor escreveu "Mateus 6:19-21", você DEVE criar 3 slides distintos:
     - Slide 1: Texto do versículo 19, com referência "Mateus 6:19"
     - Slide 2: Texto do versículo 20, com referência "Mateus 6:20"
     - Slide 3: Texto do versículo 21, com referência "Mateus 6:21"
   - Todo versículo DEVE começar e terminar com aspas tipográficas “ ... ”.

2. **FRASES DE IMPACTO, TÓPICOS E PRINCÍPIOS (type: 'topic' ou 'reflection')**:
   - Frases em CAIXA ALTA ou princípios espirituais (ex: "NÃO DEIXE A ANSIEDADE ROUBAR A CONFIANÇA:") devem ser slides do tipo "topic".
   - Frases de reflexão curtas (ex: "Poucos conseguem manter a fé quando a situação piora.") devem ser slides do tipo "reflection".

3. **PERGUNTAS CURTAS DE CHOQUE (type: 'question_short')**:
   - Perguntas curtas dramáticas (ex: "E Jairo?") devem ter type "question_short".

4. **DESTAQUES EM PALAVRAS-CHAVE (highlight: true/false)**:
   - Divida o texto de cada slide em 'runs' (fragmentos).
   - Defina 'highlight: true' para as palavras que merecem ênfase (como termos em destaque pelo pastor, promessas, palavras de fé ou verbos fortes). As demais com 'highlight: false'.
   - Para o tipo "verse", a propriedade 'reference' conterá a referência (ex: "Mateus 6:19" ou "PROVÉRBIOS 3:5").

### FORMATO DA RESPOSTA:
Responda APENAS com um array JSON válido (sem blocos de código markdown adicionais se possível, ou dentro de [ ... ]), com a seguinte estrutura:
[
  {
    "type": "verse",
    "reference": "Mateus 6:19",
    "runs": [
      { "text": "“Não ajunteis tesouros na terra, onde a traça e a ferrugem tudo consomem, e onde ", "highlight": false },
      { "text": "os ladrões minam e roubam;”", "highlight": true }
    ]
  },
  {
    "type": "question_short",
    "runs": [
      { "text": "E Jairo?", "highlight": false }
    ]
  },
  {
    "type": "topic",
    "runs": [
      { "text": "NÃO DEIXE A ANSIEDADE ROUBAR A CONFIANÇA:", "highlight": false }
    ]
  }
]

### TEXTO DO SERMÃO DO PASTOR:
${sermonText}
`;

  const models = preferredModel
    ? [preferredModel, ...FALLBACK_MODELS.filter(m => m !== preferredModel)]
    : FALLBACK_MODELS;

  let lastError = null;

  for (const model of models) {
    let timeoutId = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 20000);

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json'
          }
        })
      });

      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.error) {
        console.warn(`[Gemini AI] Modelo ${model} retornou erro:`, data.error.message);
        lastError = data.error.message;
        continue;
      }

      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        lastError = `Modelo ${model} retornou resposta vazia.`;
        continue;
      }

      const cleanJson = rawJson.replace(/```(?:json)?\s*/gi, '').replace(/```\s*$/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const list = Array.isArray(parsed) ? parsed : (parsed.slides || []);

      if (list.length > 0) {
        console.log(`[Gemini AI] Sucesso com o modelo ${model}: ${list.length} slides estruturados.`);
        return list;
      }
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      console.warn(`[Gemini AI] Falha na tentativa com modelo ${model}:`, err.message);
      lastError = err.message;
    }
  }

  throw new Error(lastError || 'Não foi possível validar os slides com a IA Gemini em nenhum dos modelos disponíveis.');
}

module.exports = { extractTextFromPdf, parseSermonWithGemini };
