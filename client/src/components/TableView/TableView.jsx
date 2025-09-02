import { useParams } from "react-router-dom"

function TableView() {
    const data = useParams();
    return (
        <div>
            <h1>{data.tablename}</h1>
        </div>
    )
}

export default TableView