const http = require('http');

async function test() {
  const res = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@toan24h.vn', password: 'password123' })
  });
  const data = await res.json();
  console.log('Login:', data);
  const token = data.accessToken || (res.headers.get('set-cookie') ? res.headers.get('set-cookie').split(';')[0].split('=')[1] : null);
  console.log('Token:', token ? "exists" : "none");
}
test();
