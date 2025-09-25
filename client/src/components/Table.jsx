import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

function Table(props) {
    const navigate = useNavigate();

    const handleJoin = () => {
        navigate(`/table/${props.name}`);
    };

    return (
        <div className="table-card">
            <div className="card-info">
                <h3 className="card-title">{props.name}</h3>
                <div className="card-players">
                    <span>{props.players} / 8</span>
                </div>
            </div>

            <Button 
                variant="contained" 
                color="success" 
                onClick={handleJoin}
            >
                Join
            </Button>
        </div>
    );
}

export default Table;