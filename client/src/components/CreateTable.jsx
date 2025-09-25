import Button from '@mui/material/Button';
import Popup from 'reactjs-popup';
import { useForm } from "react-hook-form"
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
    <Popup 
        trigger={
            <Button variant='contained' className='createTableBtn'>Create Table</Button>
        }
        modal 
        nested
    >
        {close => (
            <div className="modal">
                <button className="close" onClick={close}>
                &times;
                </button>
                <h2 className="header">Create a New Table</h2>
                <div className="content">
                    <form onSubmit={handleSubmit(onSubmit)} className="createTableForm"> 
                        <label htmlFor="tableNameInput">Table Name</label>
                        <input 
                            id="tableNameInput"
                            type="text" 
                            {...register("tablename")}
                        />
                        <Button type="submit" variant="contained" className='formSubmitBtn'>
                            Create Table
                        </Button>
                    </form>
                </div>
            </div>
        )}
    </Popup>
    )
}

export default CreateTable