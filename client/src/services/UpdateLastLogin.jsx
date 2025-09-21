/// <reference types="vite/client" />

export async function updateLastLogin(idToken){
    try {
        const res = await fetch(import.meta.env.VITE_UPDATE_LAST_LOGIN_ENDPOINT, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        })
        if(!res.ok){
            throw new Error("Couldn't update user");
        }
    } catch (error) {
        throw error
    }
}