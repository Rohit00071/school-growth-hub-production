const axios = require('axios');

async function runTest() {
    const loginData = {
        email: "bharath.superadmin@pdi.com",
        password: "Bharath@123"
    };

    try {
        console.log('--- Phase 2: Auth Fix Verification ---');
        console.log('Logging in to Gateway (Port 3000)...');
        const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', loginData);
        const token = loginRes.data.token;
        console.log('✅ Login Successful. Token obtained.');

        console.log('\nTesting protected route /api/v1/users/me...');
        const meRes = await axios.get('http://localhost:3000/api/v1/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Protected route access successful!');
        const userId = meRes.data.data.user.id;
        console.log('User ID from Service:', userId);
        console.log('User Role from Service:', meRes.data.data.user.role);

        console.log('\nTesting Observation Service through Gateway...');
        // We'll just fetch by the current user ID to see if it works
        const obsRes = await axios.get(`http://localhost:3000/api/v1/observations/teacher/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Observation Service access successful!');
        console.log('Observations found:', obsRes.data.length);

        if (userId) {
            console.log('\nPHASE 3 ✅ PASSED');
        } else {
            console.error('\nPHASE 3 ❌ FAILED');
        }

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
