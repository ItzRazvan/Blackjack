import { useEffect, useState } from 'react';
import NavBar from '../NavBar';
import Table from '../Table'
import CreateTable from '../CreateTable';
import { socket } from '../../services/Socket'

function Tables(){
    const [tables, setTables] = useState([]);

    useEffect(() => {
        const handleConnect = () => {
            socket.emit("joinTablesRoom", () => {
                socket.emit("requestTables");
            });
        };

        socket.on("tables", (receivedTables) => {
            setTables(receivedTables);
        });

        socket.on("connect", handleConnect);
        
        if (socket.connected) {
            handleConnect();
        } else {
            socket.connect();
        }
        
        return () => {
            socket.emit("leaveTablesRoom");

            socket.off("connect", handleConnect);
            socket.off("tables");
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