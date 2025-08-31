import Home from './components/Home/Home'
import Tables from './components/Tables/Tables'
import SignIn from './components/SingIn/SignIn'
import PrivateRoute from './components/PrivateRoute'
import { Route, Routes } from 'react-router-dom'

function App() {
    return(
    <Routes>
      <Route path="/signin" element={<SignIn/>} />
      <Route path="/" element={<PrivateRoute><Home/></PrivateRoute>} />
      <Route path="/tables" element={<PrivateRoute><Tables/></PrivateRoute>}/>
    </Routes>
    );
}

export default App;