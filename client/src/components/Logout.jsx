import {auth} from '../firebase'

const logout  = async () => {
    if(auth.currentUser) {
        localStorage.removeItem("uid");
        auth.signOut();
    }
}

export default logout;