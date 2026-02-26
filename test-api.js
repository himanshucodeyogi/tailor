// Test Track Order API
const https = require('https');

const data = JSON.stringify({
  phone: '6396412659'
});

const options = {
  hostname: 'tailor-gj6o.onrender.com',
  port: 443,
  path: '/api/track',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}\n`);

  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(responseData);
      console.log('Response:');
      console.log(JSON.stringify(json, null, 2));

      console.log('\n--- Checking Shop Data ---');
      if (json.orders && json.orders.length > 0) {
        json.orders.forEach((order, i) => {
          console.log(`\nOrder ${i + 1} (${order.orderNumber}):`);
          console.log('  Has shop field?', order.shop !== undefined);
          console.log('  Shop is null?', order.shop === null);
          if (order.shop) {
            console.log('  Shop name:', order.shop.name);
            console.log('  Shop code:', order.shop.code);
            console.log('  Shop address:', order.shop.address);
            console.log('  Shop phone:', order.shop.phone);
          } else {
            console.log('  ❌ Shop data is missing!');
          }
        });
      }
    } catch (e) {
      console.error('Error parsing response:', e.message);
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
