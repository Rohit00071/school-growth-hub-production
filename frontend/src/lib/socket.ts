import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
    const hostname = window.location.hostname;
    if (hostname.includes('loca.lt')) {
        return 'https://school-growth-backend-v2.loca.lt';
    }
    return import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
};

const API_URL = getSocketUrl();

let socket: Socket;

export const connectSocket = (token?: string) => {
    if (!socket || !socket.connected) {
        socket = io(API_URL, {
            auth: {
                token: token || localStorage.getItem('auth_token')
            },
            reconnection: true,
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('Connected to socket server:', socket.id);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });
    }
    return socket;
};

export const getSocket = () => {
    if (!socket) {
        return connectSocket();
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
    }
};
