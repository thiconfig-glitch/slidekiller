const https = require('https');

https.get('https://www.youtube.com/watch?v=8HVRST0FZPM', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const title = data.match(/<title>(.*?)<\/title>/);
    console.log('TITLE:', title ? title[1] : 'none');
    
    const desc = data.match(/"shortDescription":"(.*?)"/);
    if (desc) {
      console.log('FULL DESC:\n', desc[1].replace(/\\n/g, '\n'));
    }
  });
}).on('error', err => console.error(err));
