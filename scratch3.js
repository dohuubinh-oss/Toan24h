const http = require('http');

async function test() {
  const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '0986642257', password: '1' })
  });
  const loginData = await loginRes.json();
  console.log('Login JSON:', loginData);
  
  const cookieStr = loginRes.headers.get('set-cookie');
  console.log('Set-Cookie:', cookieStr);
  
  let token = null;
  if (cookieStr) {
    const match = cookieStr.match(/accessToken=([^;]+)/);
    if (match) token = match[1];
  }
  
  if (!token) {
    console.log("No token, exiting");
    return;
  }
  
  const submitRes = await fetch('http://localhost:8080/api/v1/exams/4a496b05-d4e7-4648-a88c-c25e81c53fa8/submit', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': 'accessToken=' + token
    },
    body: JSON.stringify({ answers: [] })
  });
  const submitData = await submitRes.json();
  console.log('Submit:', submitData);
}
test();
