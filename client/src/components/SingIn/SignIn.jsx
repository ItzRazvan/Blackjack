import { getAuth, signInWithPopup, getAdditionalUserInfo } from "firebase/auth"; 
import { GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import GoogleButton from 'react-google-button';
import firebaseApp from '../../firebase';
import { addUser } from "../../services/AddUser";

function SignIn() {
    const auth = getAuth(firebaseApp);
    const provider = new GoogleAuthProvider();
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            await handleSignInResult(result);
        } catch (error) {
            console.log(error.code);
        }
    };
    
    const handleSignInResult = async (result) => {
        if (!result) return;
        const additionalInfo = getAdditionalUserInfo(result);
        const user = result.user;
        if (additionalInfo.isNewUser) {
            const idToken = await user.getIdToken();
            const userData = {
                uid: user.uid,
                email: user.email,
                username: user.displayName,
            };
            await addUser(idToken, userData);
        }
        navigate('/');
    };

    return (
        <div className="signin">
            <GoogleButton 
                className="google_btn" 
                onClick={handleGoogleSignIn}
            >
                Sign in with Google
            </GoogleButton>
        </div>
    );
}

export default SignIn;