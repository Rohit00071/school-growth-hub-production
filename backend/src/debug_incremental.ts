
console.log('START DEBUG');
const start = Date.now();
try {
    console.log('Importing express...');
    const express = require('express');
    console.log('Importing prisma...');
    const prisma = require('./infrastructure/database/prisma');
    console.log('Importing redis...');
    const redis = require('./infrastructure/cache/redis');
    console.log('Importing routes...');
    const routes = require('./api/routes');
    console.log('DONE');
} catch (e) {
    console.error('CRASH AT:', e);
}
