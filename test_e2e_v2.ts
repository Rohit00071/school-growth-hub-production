import axios from 'axios';

async function test() {
    try {
        console.log('Testing Login for seeded teacher...');
        const loginRes = await axios.post('http://localhost:12348/api/v1/auth/login', {
            email: 'teacher@school.com',
            password: 'TeacherPass123!'
        });
        console.log('✅ Login success');
        const teacherId = loginRes.data.data.user.id;

        console.log('\nTesting Observation Fetch (Observation Service)...');
        const obsRes = await axios.get(`http://localhost:12348/api/v1/observations/teacher/${teacherId}`);
        console.log('✅ Observation fetch success:', JSON.stringify(obsRes.data, null, 2));

        console.log('\nTesting Stats (Observation Service)...');
        const statsRes = await axios.get(`http://localhost:12348/api/v1/observations/stats/${teacherId}`);
        console.log('✅ Stats fetch success:', JSON.stringify(statsRes.data, null, 2));

    } catch (error: any) {
        if (error.response) {
            console.error('❌ Request failed:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

test();
