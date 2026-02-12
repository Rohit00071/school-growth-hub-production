import axios from 'axios';

async function testPhase5() {
    try {
        console.log('--- Phase 5 Verification ---');

        // 1. Get Teacher ID from Login
        console.log('\nLogging in...');
        const loginRes = await axios.post('http://localhost:12348/api/v1/auth/login', {
            email: 'teacher@school.com',
            password: 'TeacherPass123!'
        });
        const teacherId = loginRes.data.data.user.id;
        console.log('✅ Logged in. Teacher ID:', teacherId);

        // 2. Test Goal Service
        console.log('\nTesting Goal Service...');
        const goalRes = await axios.post('http://localhost:12348/api/v1/goals', {
            teacherId,
            title: 'Improve Student Engagement',
            description: 'Implement active learning strategies',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            status: 'IN_PROGRESS'
        });
        console.log('✅ Goal created:', goalRes.data.id);

        const goalsList = await axios.get(`http://localhost:12348/api/v1/goals/teacher/${teacherId}`);
        console.log('✅ Goals list fetched. Count:', goalsList.data.total);

        // 3. Test Document Service
        console.log('\nTesting Document Service...');
        const docRes = await axios.post('http://localhost:12348/api/v1/documents', {
            title: 'School Policy 2026',
            fileUrl: 'https://example.com/policy.pdf',
            fileName: 'policy.pdf',
            requiresSignature: true,
            createdById: teacherId
        });
        console.log('✅ Document created:', docRes.data.id);

        console.log('\nAcknowledging document...');
        const ackRes = await axios.post(`http://localhost:12348/api/v1/documents/${docRes.data.id}/acknowledge`, {
            teacherId,
            ipAddress: '127.0.0.1'
        });
        console.log('✅ Document acknowledged:', ackRes.data.status);

        const teacherAcks = await axios.get(`http://localhost:12348/api/v1/documents/teacher/${teacherId}`);
        console.log('✅ Teacher acknowledgements fetched. Count:', teacherAcks.data.length);

        console.log('\n--- Phase 5 Verification COMPLETE ---');

    } catch (error: any) {
        if (error.response) {
            console.error('❌ Test failed:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testPhase5();
