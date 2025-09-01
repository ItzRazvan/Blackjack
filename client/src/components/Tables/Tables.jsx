import { useEffect, useState } from 'react';
import NavBar from '../NavBar';
import Table from '../Table'

function Tables(){
    const [tables, setTables] = useState([]);

    useEffect(() => {
        fetch(import.meta.env.VITE_GET_TABLES_ENDPOINT)
        .then(res => res.json())
        .then(data => setTables(data))
        .catch(error => {
            setTables([]);
        })
        
    }, []);

    return(
        <>
            <NavBar/>
            <div className="tables">
                {tables.map(table => ( 
                    <Table name={table.name} players={table.players} id={table.id} key={table.id}/>
                ))}
            </div>
        </>
    );
}

export default Tables