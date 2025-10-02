import { io } from 'socket.io-client';
import { getIdToken } from './GetIdToken';

export const socket = io('api.razvan123.eu', {
    autoConnect: false,
    auth: async (cb) => {
        const token = await getIdToken();
        cb({token});
    }
})