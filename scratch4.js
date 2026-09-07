const http = require('http');

async function test() {
  const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '0986642257', password: 'password123' })
  });
  const cookieStr = loginRes.headers.get('set-cookie');
  let token = null;
  if (cookieStr) {
    const match = cookieStr.match(/accessToken=([^;]+)/);
    if (match) token = match[1];
  }
  
  const submitRes = await fetch('http://localhost:8080/api/v1/exam-results', {
    method: 'GET',
    headers: { 
      'Cookie': 'accessToken=' + token
    }
  });
  const submitData = await submitRes.json();
  console.log('Results:', submitData);
}
test();
