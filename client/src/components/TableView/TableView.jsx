import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { socket } from "../../services/Socket";
import Button from "@mui/material/Button";
import { useState } from "react";

function TableView() {
    const [players, setPlayers] = useState([]);
    const data = useParams();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState("waiting");
    const [betStatus, setBetStatus] = useState(null);
    const [cards, setCards] = useState();
    const [winners, setWinners] = useState();

    function startGame() {
        socket.emit("startGame", {tablename: data.tablename});
    }

    function placeBet(bet){
        socket.emit("placeBet", {tablename: data.tablename, bet: bet});
    }

    function hit(){
        socket.emit("hit", {tablename: data.tablename})
    }

    function stand(){
        setGameState("wasYourTurn");
        socket.emit("stand", {tablename: data.tablename})
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
        })

        socket.on("bettingPhaseStart", () => {
            setGameState("betting");
        })

        socket.on("notEnoughMoney", () => {
            setBetStatus(false);
        })

        socket.on('betPlaced', () => {
            setBetStatus(true);
            setGameState("betSet")
        })

        socket.on("dealCards", (data) => {
            setCards(data);
            setGameState("dealCards");
        })

        socket.on("playerTurn", (data) => {
            const uid = localStorage.getItem("uid");
            if(data.uid === uid){
                setGameState("yourTurn");
            }else{
                setGameState("wasYourTurn");
            }
        })

        socket.on("allPlayersStood", (data) => {
            setGameState("allPlayersStood");
        })

        socket.on("updateCards", (data) => {
            setCards(data);
        })

        socket.on("endGame", (data) => {
            setWinners(data);
            setGameState("end");
        })

        socket.on("gameEnded", () => {
            navigate("/tables");
        })

        setup();

        return () => {
            socket.emit("leaveTable", {tablename: data.tablename});
            socket.off("error");
            socket.off("players");
            socket.off("bettingPhaseStart");
            socket.off("notEnoughMoney");
            socket.off("betPlaced");
            socket.off("dealCards");
            socket.off("updateCards");
            socket.off("playerTurn");
            socket.off("allPlayersStood");
            socket.off("endGame");
            socket.off("gameEnded");
        }
    }, [data.tablename, navigate])

    return (
        <div>
            <h1>{data.tablename}</h1>
            {gameState === 'waiting' && (
                <div>
                    <Button variant="contained" onClick={startGame}>Start game</Button>
                    <ul>
                        {players && players.map((player) => (
                            <li key={player.uid}>{player.username}</li>
                        ))}
                    </ul>   
                </div>
            )}
            {gameState === 'betting' && (
                <div>
                <h2>Betting Phase</h2>
                <Button variant="contained" onClick={() => placeBet(100)}>Place Bet 100</Button>
                    {betStatus === false && <p style={{color: 'red'}}>Not enough money!</p>}
                    {betStatus === true && <p style={{color: 'green'}}>Bet placed!</p>}
                </div>
            )}
            {gameState === 'betSet' && (
                <div>
                    <p>Waiting for the others to bet</p>
                </div>
            )}
            {(gameState === 'dealCards' || gameState === 'wasYourTurn') && (
                <div>
                    <ul>
                        {cards && cards.map((card) => (
                            <li key={card.uid}>
                                <p>{card.name}:</p>
                                <ul>
                                    {card.hand.map((c, idx) => (
                                        <li key={idx}>{c}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {gameState === 'yourTurn' && (
                <div>
                    <ul>
                        {cards && cards.map((card) => (
                            <li key={card.uid}>
                                <p>{card.name}:</p>
                                <ul>
                                    {card.hand.map((c, idx) => (
                                        <li key={idx}>{c}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                    <Button variant="contained" onClick={hit}>Hit</Button>
                    <Button variant="contained" onClick={stand}>Stand</Button>
                </div>
            )}
            {gameState === 'allPlayersStood' && (
                <div>
                    <ul>
                        {cards && cards.map((card) => (
                            <li key={card.uid}>
                                <p>{card.name}:</p>
                                <ul>
                                    {card.hand.map((c, idx) => (
                                        <li key={idx}>{c}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {gameState === 'end' && (
                <div>
                    <h3>Winners:</h3>
                    <ul>
                        {winners && winners.map((winner) => (
                            <li key={winner.uid}>
                                <p>{winner.name}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

        </div>
    )
}

export default TableView