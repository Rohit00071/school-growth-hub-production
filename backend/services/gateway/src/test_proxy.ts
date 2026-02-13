import express, { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 12347;

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'UP' });
});

const proxy = createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true
});

app.use('/proxy', proxy);

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on port ${PORT}`);
});
