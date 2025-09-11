import { io } from 'socket.io-client';
import { getIdToken } from './GetIdToken';

export const socket = io('http://127.0.0.1:9999', {
    autoConnect: false,
    auth: async (cb) => {
        const token = await getIdToken();
        cb({token});
    }
})