const https = require('https');
const fs = require('fs');

async function main() {
  const pageRes = await fetch('https://www.youtube.com/watch?v=8HVRST0FZPM', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await pageRes.text();
  const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
  if (!captionMatch) {
    console.log('No captionTracks');
    return;
  }
  let tracks = [];
  try {
    tracks = JSON.parse(captionMatch[1]);
  } catch (err) {
    console.error('Falha ao parsear captionTracks:', err.message);
    return;
  }
  console.log('Tracks:', tracks.map(t => t.baseUrl));
  
  const capRes = await fetch(tracks[0].baseUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const text = await capRes.text();
  fs.writeFileSync('c:\\Projetos\\slidekiller\\scripts\\transcript.xml', text);
  console.log('TRANSCRIPT XML LENGTH:', text.length);
  console.log('FIRST 500 CHARS:\n', text.slice(0, 500));
}

main().catch(console.error);
