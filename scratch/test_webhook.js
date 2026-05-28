const http = require('http');

const testEvent = {
  id: 'evt_1234567890',
  event: 'transaction.approved',
  data: {
    id: 98765,
    reference: 'TTB-MOCKREF-1234',
    amount: 1000,
    currency: { iso: 'XOF' },
    status: 'approved',
    mode: 'mtn',
    customer: {
      phone_number: { number: '97000000', country: 'BJ' }
    }
  }
};

const payload = JSON.stringify(testEvent);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhook/fedapay',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('Envoi de la simulation de Webhook FedaPay...');

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(`Statut de la réponse: ${res.statusCode}`);
    console.log('Corps de la réponse:', body);
  });
});

req.on('error', (e) => {
  console.error(`Erreur lors de la requête: ${e.message}`);
  console.log('Note: Assurez-vous que le serveur de dev Next.js tourne sur le port 3000 (npm run dev).');
});

req.write(payload);
req.end();
