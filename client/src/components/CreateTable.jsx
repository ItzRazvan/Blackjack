import Button from '@mui/material/Button';
import Popup from 'reactjs-popup';
import { useForm } from "react-hook-form"
import { createTable } from "../services/CreateTable"
import { getIdToken }  from '../services/GetIdToken';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/Socket'
import { useEffect } from 'react';
import { useState } from 'react';

function CreateTable() {
    const navigate = useNavigate();
    const [tablename, setTablename] = useState();

    const {register, handleSubmit} = useForm();
    const onSubmit = async (data) => {
        socket.emit("createTable", {tablename: data.tablename});
        setTablename(data.tablename);
    }

    useEffect(() => {
        socket.connect();

        socket.on("tableReady", () => {
            navigate(`/table/${tablename}`);
        })

        return () => {
            socket.off("tableReady");
        }
    })

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