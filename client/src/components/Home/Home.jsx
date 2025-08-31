import { useNavigate } from 'react-router-dom'
import NavBar from '../NavBar'
import Button from '@mui/material/Button'

function Home() {
    const navigate = useNavigate();
    return(
        <>
            <NavBar/>
            <div className='find_game'>
                <Button variant='contained' className='find_game_btn' onClick={() => {navigate('/tables')}}>Find Game</Button>
            </div>
        </>
    )
}

export default Home;