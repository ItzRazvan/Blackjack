import { getAuth, signInWithPopup } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import GoogleButton from 'react-google-button'
import firebaseApp from '../../firebase'

const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();

function SignIn(){
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        try{
            await signInWithPopup(auth, provider);
            navigate('/');
        } catch (error) {
            console.log(error.code);
        }
    }

    return(
        <div className="signin">
            <GoogleButton className="google_btn" onClick={() => {handleGoogleSignIn();}} /> 
        </div>
    )
}

export default SignIn