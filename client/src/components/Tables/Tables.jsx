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
            socket.off("connect", handleConnect);
            socket.off("tables");
        };
    }, []);


return (
        <div className="tables-page">
            <NavBar />
            <div className="tables-container">
                <header className="tables-header">
                    <h1>Join a Game</h1>
                </header>

                <div className="tables-grid">
                    {tables.map(table => (
                        <Table name={table.name} players={table.players} id={table.id} key={table.id} />
                    ))}
                </div>
            </div>
            <CreateTable />
        </div>
    );
}

export default Tables