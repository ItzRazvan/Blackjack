import { auth } from '../firebase'

export async function getIdToken(){
    try{
        const token = await auth.currentUser.getIdToken();
        return token;
    } catch (error) {
        throw error;
    }
}