import Button from '@mui/material/Button'
import { joinTable } from '../services/JoinTable'


function Table(props){
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
                    <Button variant='contained' className='join_table_btn' onClick={() => {joinTable(props.id)}}>Join</Button>
                </div>
            </div>
        </>
    )
}


export default Table