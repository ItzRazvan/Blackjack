import { useNavigate } from 'react-router-dom';
import NavBar from '../NavBar';
import Button from '@mui/material/Button';

function Home() {
    const navigate = useNavigate();

    return (
        <>
            <NavBar />
            <div className='hero'>
                <div className='hero_content'>
                    <h1>Your Table is Waiting</h1>
                    <Button 
                        variant='contained' 
                        onClick={() => navigate('/tables')}
                        sx={{
                            padding: '10px 40px',
                            fontSize: '1.5rem',
                            borderRadius: '12px',
                            backgroundColor: '#4CAF50',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                            textTransform: 'none',
                            fontFamily: "'Roboto Mono', monospace", 
                            fontWeight: 'bold',
                            '&:hover': {
                                backgroundColor: '#45a049',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                            },
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        Find a Game
                    </Button>
                </div>
            </div>
        </>
    );
}

export default Home;