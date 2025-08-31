/// <reference types="vite/client" />

export async function joinTable(id){
    let payload = JSON.stringify({id});
    fetch(import.meta.env.VITE_JOIN_TABLE_ENDPOINT , {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: payload
    })
}