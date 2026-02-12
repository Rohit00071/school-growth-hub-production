import express, { Request, Response } from 'express';

const app = express();
const PORT = 12346;

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'UP' });
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on port ${PORT}`);
});
