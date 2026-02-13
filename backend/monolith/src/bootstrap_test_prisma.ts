console.log('BEGIN BOOTSTRAP');
try {
    require('dotenv').config();
    console.log('DOTENV LOADED');
    const { PrismaClient } = require('@prisma/client');
    console.log('PRISMA IMPORTED');
    const prisma = new PrismaClient();
    console.log('PRISMA INSTANTIATED');
    const express = require('express');
    const app = express();
    app.get('/health', (req: any, res: any) => res.send('OK'));
    app.listen(4001, () => console.log('LISTEN 4001'));
} catch (e) {
    console.error('BOOTSTRAP CRASH:', e);
}
