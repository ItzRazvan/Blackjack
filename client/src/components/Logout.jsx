import { getAuth } from 'firebase/auth'
import firebaseApp from '../firebase'

const logout  = async () => {
    const auth = getAuth(firebaseApp);
    if(auth.currentUser) {
        auth.signOut();
    }
}

export default logout;