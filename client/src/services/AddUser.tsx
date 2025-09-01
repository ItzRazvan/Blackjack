/// <reference types="vite/client" />

export async function addUser(idToken){
    try {
        const res = await fetch(import.meta.env.VITE_ADD_USER_ENDPOINT, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        })
        if(!res.ok){
            throw new Error("Couldn't add user to database");
        }
    } catch (error) {
        throw error
    }
}