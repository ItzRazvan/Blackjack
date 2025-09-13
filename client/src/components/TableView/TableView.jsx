import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { joinTable } from "../../services/JoinTable";
import { leaveTable } from "../../services/LeaveTable"
import { socket } from "../../services/Socket";

function TableView() {
    const data = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const setup = async () => {
            try{
                socket.connect();
                socket.emit("joinTable", {tablename: data.tablename});
            } catch (error) {
                navigate('/tables');
            }
        }
        setup();

        return () => {
            socket.emit("leaveTable", {tablename: data.tablename});
        }
    }, [data.tablename, navigate])

    return (
        <div>
            <h1>{data.tablename}</h1>
        </div>
    )
}

export default TableView