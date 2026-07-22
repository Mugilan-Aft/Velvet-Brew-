async function run() {
  console.log('Fetching menu...');
  const res = await fetch('http://localhost:3000/api/menu');
  const menu = await res.json();
  
  if (!menu || menu.length === 0) {
    console.error('No menu available to seed data.');
    return;
  }
  
  console.log('Sending seed request to API...');
  const res2 = await fetch('http://localhost:3000/api/seed-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ menu })
  });
  
  const text = await res2.text();
  console.log('Seed response:', text);
}
run();
