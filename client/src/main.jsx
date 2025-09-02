import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import './components/Home/home.css'
import './components/Tables/tables.css'
import './components/SingIn/signin.css'
import './components/TableView/tableview.css'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
       <App />
    </BrowserRouter>
)
