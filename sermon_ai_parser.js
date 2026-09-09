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
Sua missão é transformar o texto/esboço de um sermão enviado pelo pastor em uma sequência de SLIDES INDIVIDUAIS estruturados em JSON, seguindo rigorosamente as seguintes REGRAS:

### REGRA CRÍTICA E OBRIGATÓRIA:
NÃO OMITA, NÃO RESUMA E NÃO EXCLUA NENHUM PARÁGRAFO OU FRASE!
Todo o conteúdo do sermão (introduções pastorais, reflexões, comentários, tópicos e versículos bíblicos) deve ser transformado em slides na íntegra.
Se houver marcações [HL]...[/HL] no texto, você DEVE preservar esses trechos com "highlight": true.

1. **QUEBRA DE VERSÍCULOS (1 VERSÍCULO POR SLIDE)**:
   - NUNCA coloque múltiplos versículos juntos em um único slide.
   - Se o pastor escreveu "Mateus 6:19-21", você DEVE criar 3 slides distintos com referência "Mateus 6:19", "Mateus 6:20", etc.
   - Se o versículo vier antes da referência (ex: texto nas primeiras linhas e "Mateus 6:24" na linha seguinte), conecte a referência ao versículo.
   - Todo versículo DEVE começar e terminar com aspas tipográficas “ ... ”.

2. **FRASES DE IMPACTO, TÓPICOS E PRINCÍPIOS (type: 'topic')**:
   - Títulos de seções, pontos numerados (ex: "8. O Servo no Reino de Deus") ou cabeçalhos em maiúsculo devem ser slides do tipo "topic".

3. **COMENTÁRIOS E INTRODUÇÕES PASTORAIS (type: 'reflection')**:
   - Todos os parágrafos explicativos e frases do pregador devem virar slides do tipo "reflection". Se o parágrafo for longo, divida em 2 slides para caber na tela, mas NUNCA resuma ou corte nenhuma palavra!

4. **PERGUNTAS CURTAS DE CHOQUE (type: 'question_short')**:
   - Perguntas curtas dramáticas devem ter type "question_short".

5. **DESTAQUES EM PALAVRAS-CHAVE (highlight: true/false)**:
   - Divida o texto de cada slide em 'runs' (fragmentos), marcando palavras de ênfase (ou onde houver [HL]...[/HL]) com highlight: true.

### FORMATO DA RESPOSTA:
Responda APENAS com um array JSON válido, com a seguinte estrutura:
[
  {
    "type": "topic",
    "runs": [
      { "text": "8. O Servo no Reino de Deus", "highlight": false }
    ]
  },
  {
    "type": "verse",
    "reference": "Mateus 6:24",
    "runs": [
      { "text": "“Ninguém pode servir a dois senhores; porque ou há de odiar um e amar o outro... ", "highlight": false },
      { "text": "Não podeis servir a Deus e a Mamom.”", "highlight": true }
    ]
  },
  {
    "type": "reflection",
    "runs": [
      { "text": "Quem pertence ao Reino de Deus não pode dividir o coração entre dois senhores.", "highlight": false }
    ]
  }
]

### TEXTO COMPLETO DO SERMÃO DO PASTOR:
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
        list.forEach(s => {
          if (s.runs && Array.isArray(s.runs)) {
            s.runs.forEach(r => {
              if (r.text) {
                if (r.text.includes('[HL]')) r.highlight = true;
                r.text = r.text.replace(/\[\/?HL\]/g, '');
              }
            });
          }
        });
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
