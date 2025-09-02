/// <reference types="vite/client" />

export async function createTable(idToken, tableName){
    try {
        const endpoint = `${import.meta.env.VITE_CREATE_TABLE_ENDPOINT}?tablename=${tableName}`;
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        })
        if(!res.ok){
            throw new Error("Couldn't create Table");
        }
    } catch (error) {
        throw error
    }
}