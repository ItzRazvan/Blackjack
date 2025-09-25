import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { socket } from "../../services/Socket";
import Button from "@mui/material/Button";
import { useState } from "react";
import PlayerSeat from "../PlayerSeat";

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

    const uid = localStorage.getItem("uid");
    const dealer = cards?.find(p => p.name === 'Dealer');
    const playersWithoutDealer = cards?.filter(p => p.name !== 'Dealer');

    const activeGameStates = [
        'betting', 
        'betSet', 
        'dealCards', 
        'yourTurn', 
        'wasYourTurn', 
        'allPlayersStood'
    ];

    return (
        <div className="game-table">
            <h1 className="table-title">{data.tablename}</h1>

            {gameState === 'waiting' && (
                <div className="waiting-lobby">
                    <h2>Waiting for Players...</h2>
                    <ul className="player-list">
                        {players && players.map((player) => (
                            <li key={player.uid}>{player.username}</li>
                        ))}
                    </ul>
                    <Button variant="contained" color="success" size="large" onClick={startGame}>
                        Start Game
                    </Button>
                </div>
            )}

            {gameState === 'end' && (
                <div className="winner-modal">
                    <h2>Round Over!</h2>
                    <h3>Winners:</h3>
                    <ul className="winner-list">
                        {winners && winners.length > 0 ? (
                            winners.map((winner) => (
                                <li key={winner.uid}>{winner.name}</li>
                            ))
                        ) : (
                            <li>No winners this round.</li>
                        )}
                    </ul>
                    <p className="modal-subtext">Returning to the table list...</p>
                </div>
            )}

            {activeGameStates.includes(gameState) && (
            <>
                <div className="dealer-area">
                    {dealer && <PlayerSeat player={dealer} />}
                </div>

                <div className="actions-area">

                    {gameState === 'betting' && (
                        <div className="action-buttons">
                            <Button 
                                variant="contained" 
                                color="success" 
                                onClick={() => placeBet(100)}
                                sx={{
                                    padding: '12px 30px',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    animation: 'pulse 1.5s infinite'
                                }}
                            >
                                Bet 100
                            </Button>
                            {betStatus === false && <p style={{color: 'red'}}>Not enough money!</p>}
                        </div>
                    )}

                    {gameState === 'yourTurn' && (
                        <div className="action-buttons">
                            <Button variant="contained" color="primary" size="large" onClick={hit}>Hit</Button>
                            <Button variant="contained" color="secondary" size="large" onClick={stand}>Stand</Button>
                        </div>
                    )}
                </div>
                <div className="player-row">
                    {playersWithoutDealer && playersWithoutDealer.map((player) => (
                        <PlayerSeat
                            key={player.uid}
                            player={player}
                            isCurrentPlayer={gameState === 'yourTurn' && player.uid === uid}
                        />
                    ))}
                </div>
              </>
            )}
        </div>
        
    );
}

export default TableView;
