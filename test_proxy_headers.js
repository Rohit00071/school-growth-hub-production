// Quick test to verify proxy header forwarding
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/test', createProxyMiddleware({
    target: 'http://localhost:3003',
    changeOrigin: true,
    on: {
        proxyReq: (proxyReq, req) => {
            console.log('Setting test header');
            proxyReq.setHeader('x-test-header', 'test-value');
        }
    }
}));

app.listen(9999, () => console.log('Test proxy on 9999'));
