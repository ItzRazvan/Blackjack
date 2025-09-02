import Button from '@mui/material/Button';
import Popup from 'reactjs-popup';
import { useForm } from "react-hook-form"
import { createTable } from "../services/CreateTable"
import { getIdToken }  from '../services/GetIdToken';
import { useNavigate } from 'react-router-dom';

function CreateTable() {
    const navigate = useNavigate();

    const {register, handleSubmit} = useForm();
    const onSubmit = async (data) => {
        await createTable(await getIdToken(), data.tablename);
        navigate(`/table/${data.tablename}`);
    }

    return(
        <Popup trigger={ <Button variant='contained'>Create Table</Button>} position="right center">
             <div>
                <form onSubmit={handleSubmit(onSubmit)}> 
                    <label>Table Name
                        <input {...register("tablename")}/>
                    </label>
                    <input type="submit" value="Create"/>
                </form>
             </div>
        </Popup>
    )
}

export default CreateTable