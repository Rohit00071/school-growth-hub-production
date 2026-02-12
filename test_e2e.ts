import axios from 'axios';

async function test() {
    try {
        console.log('Testing Registration through Gateway...');
        const regRes = await axios.post('http://localhost:12348/api/v1/auth/register', {
            email: 'ext_teacher@school.com',
            password: 'Pass123!',
            fullName: 'Ext Teacher',
            role: 'TEACHER'
        });
        console.log('✅ Registration success:', regRes.data);

        console.log('\nTesting Login through Gateway...');
        const loginRes = await axios.post('http://localhost:12348/api/v1/auth/login', {
            email: 'ext_teacher@school.com',
            password: 'Pass123!'
        });
        console.log('✅ Login success:', loginRes.data);
        const token = loginRes.data.token;
        const teacherId = loginRes.data.user.id;

        console.log('\nTesting Observation through Gateway (New Service)...');
        const obsRes = await axios.get(`http://localhost:12348/api/v1/observations/teacher/${teacherId}`);
        console.log('✅ Observation fetch success:', obsRes.data);

        console.log('\nTesting Monolith (Health) through Gateway...');
        const healthRes = await axios.get('http://localhost:12348/api/v1/health');
        console.log('✅ Monolith health check success:', healthRes.data);

    } catch (error: any) {
        if (error.response) {
            console.error('❌ Request failed with status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

test();
