import { useEffect, useState } from 'react';
import NavBar from '../NavBar';
import Table from '../Table'
import CreateTable from '../CreateTable';
import { io } from "socket.io-client"

const socket = io("http://127.0.0.1:9999");

function Tables(){
    const [tables, setTables] = useState([]);

    useEffect(() => {
        socket.on("tables", (tables) => {
            setTables(tables);
        });

        if(socket.connected){
            socket.emit("requestTables");
        }

        return () => {
            socket.off("tables");
            socket.off("connect");
        };
    }, []);

    return(
        <>
            <NavBar/>
            <div className="tables">
                {tables.map(table => ( 
                    <Table name={table.name} players={table.players} id={table.id} key={table.id}/>
                ))}
            </div>
            <CreateTable/>
        </>
    );
}

export default Tables