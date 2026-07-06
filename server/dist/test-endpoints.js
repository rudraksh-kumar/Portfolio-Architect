async function testEndpoints() {
    try {
        console.log('Testing GET /api/portfolio/p/rudraksh-kumar...');
        const getRes = await fetch('http://localhost:5000/api/portfolio/p/rudraksh-kumar');
        console.log('GET Status:', getRes.status);
        const getData = await getRes.json();
        console.log('GET Response keys:', Object.keys(getData));
        if (getData.error) {
            console.error('GET Error:', getData.error);
        }
        console.log('\nTesting POST /api/portfolio/p/rudraksh-kumar/chat...');
        const postRes = await fetch('http://localhost:5000/api/portfolio/p/rudraksh-kumar/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'What programming languages do you know?',
                history: []
            })
        });
        console.log('POST Status:', postRes.status);
        const postData = await postRes.json();
        console.log('POST Response:', postData);
    }
    catch (err) {
        console.error('Fetch failed:', err);
    }
}
testEndpoints();
export {};
