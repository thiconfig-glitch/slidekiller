const pdf = require('pdf-parse');

/**
 * Extracts raw text from a PDF Buffer
 */
async function extractTextFromPdf(pdfBuffer) {
  const data = await pdf(pdfBuffer);
  return data.text;
}

/**
 * Parses sermon text into structured slide items using Gemini AI
 */
async function parseSermonWithGemini(sermonText, apiKey, model = 'gemini-3.6-flash') {
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

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      }
    })
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || 'Erro ao chamar a API Gemini');
  }

  const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) {
    throw new Error('Nenhuma resposta recebida do modelo.');
  }

  try {
    const parsed = JSON.parse(rawJson);
    return Array.isArray(parsed) ? parsed : (parsed.slides || []);
  } catch (err) {
    // Fallback: extract json from codeblocks if any
    const clean = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  }
}

module.exports = { extractTextFromPdf, parseSermonWithGemini };
