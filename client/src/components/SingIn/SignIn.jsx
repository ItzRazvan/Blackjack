import { getAuth, signInWithPopup, getAdditionalUserInfo, getRedirectResult, signInWithRedirect } from "firebase/auth"; 
import { GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import GoogleButton from 'react-google-button';
import firebaseApp from '../../firebase';
import { addUser } from "../../services/AddUser";
import { updateLastLogin } from "../../services/UpdateLastLogin";
import { useEffect } from "react";

function SignIn() {
    const navigate = useNavigate();
    const auth = getAuth(firebaseApp);

    useEffect(() => {
        getRedirectResult(auth)
            .then((result) => {
                console.log(result);
                if (result) {
                    handleSignInResult(result).then(() => {navigate('/')})
                }
            })
            .catch((error) => {
                console.log(error.code);
            });
    }, [auth, navigate]);

    const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
        if (/Mobi|Android/i.test(navigator.userAgent)) {
            await signInWithRedirect(auth, provider);
        } else {
            const result = await signInWithPopup(auth, provider);
            await handleSignInResult(result);
            navigate('/');
        }
    } catch (error) {
        console.log(error.code);
    }
};
    
    const handleSignInResult = async (result) => {
        if (!result) return;
        const additionalInfo = getAdditionalUserInfo(result);
        const user = result.user;
        localStorage.setItem("uid", user.uid);
        if (additionalInfo.isNewUser) {
            const idToken = await user.getIdToken();
            const userData = {
                uid: user.uid,
                email: user.email,
                username: user.displayName,
            };
            await addUser(idToken, userData);
        }else{
            updateLastLogin(idToken);
        }
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