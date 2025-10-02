const formatCardNameForFile = (cardName) => {
    if (!cardName) return '';
    if (cardName === 'X') return '/cards/X.png';
    const card = cardName.toLowerCase().replace(' ', '_of_');
    return `/cards/${card}.png`;
};

function PlayerSeat({ player, isCurrentPlayer }) {
    const playerClass = isCurrentPlayer ? 'player-seat current-player' : 'player-seat';
    const overlap = 115 / player.hand.length;
    
    return (
        <div className={playerClass}>
            {isCurrentPlayer && <div className="turn-indicator">Your Turn</div>}
            
            <div className="player-info">
                <span className="player-name">{player.name}</span>
                {player.handValue > 0 && <span className="hand-value">{player.handValue}</span>}
            </div>
            <div className="card-hand">
                {player.hand.map((card, index) => (
                    <img
                        key={index}
                        src={formatCardNameForFile(card)}
                        alt={card}      
                        className={`card ${index === player.hand.length - 1 ? "new" : ""}`}
                        style={{ marginLeft: index > 0 ? `${index * -overlap}px` : '0' }}
                    />
                ))}
            </div>
        </div>
    );
}

export default PlayerSeat;