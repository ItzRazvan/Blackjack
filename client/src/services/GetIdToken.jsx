import { getAuth } from 'firebase/auth'
import firebaseApp from '../firebase'

export async function getIdToken(){
    const auth = getAuth(firebaseApp);
    try{
        const token = await auth.currentUser.getIdToken();
        return token;
    } catch (error) {
        throw error;
    }
}