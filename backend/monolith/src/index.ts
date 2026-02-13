import app from './app';
import { initializeSocket } from './core/socket';

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`💉 Health: http://localhost:${PORT}/health\n`);
});

console.log("DEBUG: Initializing socket...");
initializeSocket(server);
console.log("DEBUG: Socket initialized.");

// Keep process alive for debugging
setInterval(() => {
    // console.log("DEBUG: Keep-alive tick");
}, 10000);
