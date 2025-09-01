/// <reference types="vite/client" />

export async function joinTable(id){
    try {
        const endpoint = `${import.meta.env.VITE_JOIN_TABLE_ENDPOINT}/${id}`;
        const res = await fetch(endpoint , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if(!res.ok){
            throw new Error("Failed to join table");
        };

    } catch (error) {
        throw error;
    }
}