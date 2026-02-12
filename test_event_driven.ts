import axios from 'axios';

async function testEventDriven() {
    try {
        console.log('--- Event-Driven Architecture Verification ---');

        // 1. Get Teacher ID
        console.log('\nLogging in...');
        const loginRes = await axios.post('http://localhost:12348/api/v1/auth/login', {
            email: 'teacher@school.com',
            password: 'TeacherPass123!'
        });
        const teacherId = loginRes.data.data.user.id;
        console.log('✅ Logged in.');

        // 2. Create an Observation (Trigger event)
        console.log('\nCreating an Observation to trigger events...');
        const obsRes = await axios.post('http://localhost:12348/api/v1/observations', {
            teacherId: teacherId,
            observerId: 'some-observer-id',
            date: new Date().toISOString(),
            domain: 'Teaching Excellence',
            score: 4.5,
            status: 'SUBMITTED'
        });
        const obsId = obsRes.data.id;
        console.log('✅ Observation created:', obsId);

        // 3. Wait for async processing
        console.log('\nWaiting 3 seconds for async processing...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 4. Check if Notification Service picked it up
        console.log('\nChecking Notification Service for auto-generated alert...');
        const notifRes = await axios.get(`http://localhost:12348/api/v1/notifications/user/${teacherId}`);
        const found = notifRes.data.some((n: any) => n.link?.includes(obsId));
        if (found) {
            console.log('✅ Event-driven notification FOUND!');
        } else {
            console.log('❌ Event-driven notification NOT found.');
        }

        // 5. Check if Analytics Service picked it up
        console.log('\nChecking Analytics Service for tracked event...');
        const statsRes = await axios.get('http://localhost:12348/api/v1/analytics/stats');
        console.log('✅ Total events in Analytics:', statsRes.data.totalEvents);

        console.log('\n--- Event-Driven Architecture Verification COMPLETE ---');

    } catch (error: any) {
        if (error.response) {
            console.error('❌ Test failed:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testEventDriven();
