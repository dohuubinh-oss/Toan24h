const http = require('http');

async function test() {
  const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '0986642257', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log('Token:', token ? 'exists' : 'no');

  const submitRes = await fetch('http://localhost:8080/api/v1/exams/d259df41-b467-41be-b332-b16b6cd7c7b1/submit', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ answers: [] })
  });
  const submitData = await submitRes.json();
  console.log('Submit:', submitData);
}
test();
