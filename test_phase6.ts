import axios from 'axios';

async function testPhase6() {
    try {
        console.log('--- Phase 6 Verification ---');

        // 1. Get Teacher ID
        console.log('\nLogging in...');
        const loginRes = await axios.post('http://localhost:12348/api/v1/auth/login', {
            email: 'teacher@school.com',
            password: 'TeacherPass123!'
        });
        const teacherId = loginRes.data.data.user.id;
        console.log('✅ Logged in.');

        // 2. Test Notification Service
        console.log('\nTesting Notification Service...');
        const notifRes = await axios.post('http://localhost:12348/api/v1/notifications', {
            userId: teacherId,
            title: 'Welcome!',
            message: 'Your account is ready.',
            type: 'SYSTEM'
        });
        console.log('✅ Notification created:', notifRes.data.id);

        const listRes = await axios.get(`http://localhost:12348/api/v1/notifications/user/${teacherId}`);
        console.log('✅ User notifications fetched. Count:', listRes.data.length);

        // 3. Test Analytics Service
        console.log('\nTesting Analytics Service...');
        const metricRes = await axios.post('http://localhost:12348/api/v1/analytics/track', {
            name: 'test_event',
            value: 1.0,
            userId: teacherId,
            metadata: { source: 'test_script' }
        });
        console.log('✅ Metric tracked:', metricRes.data.id);

        const statsRes = await axios.get('http://localhost:12348/api/v1/analytics/stats');
        console.log('✅ System stats fetched. Total events:', statsRes.data.totalEvents);

        console.log('\n--- Phase 6 Verification COMPLETE ---');

    } catch (error: any) {
        if (error.response) {
            console.error('❌ Test failed:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testPhase6();
