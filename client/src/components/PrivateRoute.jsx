import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { auth } from '../firebase'

function PrivateRoute({ children }) {
    const [user, setUser] = useState(undefined);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    if (user === undefined) {
        return null;
    }

    return user ? children : <Navigate to="/signin" replace />;
}

export default PrivateRoute