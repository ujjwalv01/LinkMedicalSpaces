const https = require('https');

https.get('https://www.linkmedicalspaces.com/realtors/', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const hexRegex = /#[0-9a-fA-F]{3,6}/g;
    const colors = data.match(hexRegex);
    if (colors) {
      const counts = {};
      colors.forEach(c => {
        const lower = c.toLowerCase();
        counts[lower] = (counts[lower] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 10);
      console.log('Most common colors:', sorted);
    } else {
      console.log('No colors found');
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
