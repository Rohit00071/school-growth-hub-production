import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.post('/test-register', async (req, res) => {
    try {
        console.log('Received request:', req.body);

        const { email, password, fullName, role } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        console.log('Password hashed');

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                role: role || 'TEACHER'
            }
        });

        console.log('User created:', user.id);

        res.json({ status: 'success', user: { id: user.id, email: user.email } });
    } catch (error: any) {
        console.error('Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(3002, () => {
    console.log('Test server running on port 3002');
});
