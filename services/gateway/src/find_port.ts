import net from 'net';

function findFreePort(startPort: number): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.on('error', () => {
            resolve(findFreePort(startPort + 1));
        });
        server.listen(startPort, '127.0.0.1', () => {
            server.close(() => {
                resolve(startPort);
            });
        });
    });
}

findFreePort(9000).then(port => {
    console.log('FREE_PORT:', port);
});
