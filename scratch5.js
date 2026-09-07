const http = require('http');

async function test() {
  const loginRes = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '0986642257', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const cookieStr = loginRes.headers.get('set-cookie');
  let token = null;
  if (cookieStr) {
    const match = cookieStr.match(/accessToken=([^;]+)/);
    if (match) token = match[1];
  }
  
  if (!token) {
    console.log("Login failed", loginData);
    return;
  }
  
  // Try submit
  const submitRes = await fetch('http://localhost:8080/api/v1/exams/4a496b05-d4e7-4648-a88c-c25e81c53fa8/submit', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': 'accessToken=' + token
    },
    body: JSON.stringify({ answers: [] })
  });
  const submitData = await submitRes.json();
  console.log('Submit result:', submitData);

  // Fetch results
  const resultsRes = await fetch('http://localhost:8080/api/v1/exam-results', {
    method: 'GET',
    headers: { 
      'Cookie': 'accessToken=' + token
    }
  });
  const resultsData = await resultsRes.json();
  console.log('My Results count:', resultsData.data?.length);
}
test();
