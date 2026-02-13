const axios = require('axios');

async function runTest() {
    const loginData = {
        email: "teacher1.btmlayout@pdi.com",
        password: "Teacher1@123"
    };

    try {
        console.log('--- Teacher Login Verification ---');
        console.log('Logging in to Gateway (Port 3000)...');
        const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', loginData);
        const token = loginRes.data.token;
        console.log('✅ Login Successful. Token obtained.');

        console.log('\nTesting protected route /api/v1/users/me...');
        const meRes = await axios.get('http://localhost:3000/api/v1/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Protected route access successful!');
        console.log('User:', meRes.data.data.user.fullName);

    } catch (error) {
        if (error.response) {
            console.error('\n❌ Request failed with status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('\n❌ Error:', error.message);
        }
        process.exit(1);
    }
}

runTest();
