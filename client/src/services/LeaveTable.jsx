/// <reference types="vite/client" />

import { getIdToken } from "./GetIdToken";

export async function leaveTable(tablename){
    try {
        const endpoint = `${import.meta.env.VITE_LEAVE_TABLE_ENDPOINT}/${tablename}`;
        const idToken = await getIdToken();
        const res = await fetch(endpoint , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            keepalive: true,
        });
        if(!res.ok){
            throw new Error("Failed to leave table");
        };

    } catch (error) {
        throw error;
    }
}