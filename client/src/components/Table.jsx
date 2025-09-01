import Button from '@mui/material/Button'
import { joinTable } from '../services/JoinTable'
import { useState } from 'react'


function Table(props){
    const [error, setError] = useState('');

     const handleJoin = async () => {
        try {
            await joinTable(props.id);
            setError('');
        } catch (err) {
            setError('Error');
        }
    };

    return(
        <>
            <div className="table">
                <div className="table_info">
                    <h4 className="name">
                        {props.name}
                    </h4>
                    <h4 className="players">
                        Players: {props.players}
                    </h4>
                </div>
                <div className="join_table">
                    {error ? (
                    <Button variant="contained" className="join_table_btn" disabled>
                        {error}
                    </Button>
                    ) : (
                    <Button variant="contained" className="join_table_btn" onClick={handleJoin}>
                        Join
                    </Button>
                    )}
                </div>
            </div>
        </>
    )
}


export default Table