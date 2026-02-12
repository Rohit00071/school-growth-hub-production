console.log('BEGIN BOOTSTRAP');
try {
    require('dotenv').config();
    console.log('DOTENV LOADED');
    const express = require('express');
    console.log('EXPRESS LOADED');
    const app = express();
    app.get('/health', (req: any, res: any) => res.send('OK'));
    app.listen(4001, () => console.log('LISTEN 4001'));
} catch (e) {
    console.error('BOOTSTRAP CRASH:', e);
}
