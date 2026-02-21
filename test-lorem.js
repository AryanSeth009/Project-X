const https = require('https');
https.get('https://loremflickr.com/800/600/Munnar', (res) => {
  console.log('StatusCode:', res.statusCode);
  console.log('Location:', res.headers.location);
}).on('error', (e) => {
  console.error(e);
});
