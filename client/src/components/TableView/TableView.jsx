import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { socket } from "../../services/Socket";
import Button from "@mui/material/Button";
import { useState } from "react";

function TableView() {
    const [players, setPlayers] = useState([]);
    const data = useParams();
    const navigate = useNavigate();

    function startGame() {
        socket.emit("startGame", {tablename: data.tablename});
    }

    useEffect(() => {
        const setup = async () => {
            try{
                socket.connect();
                socket.emit("joinTable", {tablename: data.tablename});
            } catch (error) {
                navigate('/tables');
            }
        }

        socket.on("error", (data) => {
            console.log(data);
        })

        socket.on("players", (data) => {
            setPlayers(data.players)
            console.log(players);
        })

        socket.on("start", () => {
            console.log("game started");
        })

        setup();

        return () => {
            socket.emit("leaveTable", {tablename: data.tablename});
            socket.off("error");
            socket.off("start");
            socket.off("players");
        }
    }, [data.tablename, navigate])

    return (
        <div>
            <h1>{data.tablename}</h1>
            <Button variant="contained" onClick={startGame}>Start game</Button>
            <ul>
                {players && players.map((player) => (
                    <li key={player.uid}>{player.username}</li>
                ))}
            </ul>   
        </div>
    )
}

export default TableView