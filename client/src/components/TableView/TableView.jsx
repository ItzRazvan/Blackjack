import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { joinTable } from "../../services/JoinTable";
import { leaveTable } from "../../services/LeaveTable"

function TableView() {
    const data = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const setup = async () => {
            try{
                await joinTable(data.tablename);
            } catch (error) {
                navigate('/tables');
            }
        }
        setup();

        return () => {
            leaveTable(data.tablename);
        }
    }, [data.tablename, navigate])

    return (
        <div>
            <h1>{data.tablename}</h1>
        </div>
    )
}

export default TableView