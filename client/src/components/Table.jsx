import Button from '@mui/material/Button'
import { useNavigate } from 'react-router-dom'


function Table(props){
    const navigate = useNavigate();
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
                    <Button variant="contained" className="join_table_btn" onClick={() => {navigate(`/table/${props.name}`)}}>
                        Join
                    </Button>
                </div>
            </div>
        </>
    )
}


export default Table