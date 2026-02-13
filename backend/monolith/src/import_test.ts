
console.log('IMPORT START');
try {
    const express = require('express');
    console.log('EXPRESS OK');
    const { createProxyMiddleware } = require('http-proxy-middleware');
    console.log('PROXY OK:', typeof createProxyMiddleware);
    const cors = require('cors');
    console.log('CORS OK');
    const helmet = require('helmet');
    console.log('HELMET OK');
    const routes = require('./api/routes').default; // Need .default for TS exports
    console.log('ROUTES OK');
    console.log('IMPORT COMPLETE');
} catch (e) {
    console.error('IMPORT CRASH:', e);
}
