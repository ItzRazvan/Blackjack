const calculateHandValue = (hand) => {
    let value = 0;
    let aceCount = 0;
    for (const card of hand) {
        if (!card || card === 'X') continue;
        const rank = card.split(' ')[0];
        if (['Jack', 'Queen', 'King'].includes(rank)) {
            value += 10;
        } else if (rank === 'Ace') {
            value += 11;
            aceCount += 1;
        } else {
            value += parseInt(rank, 10);
        }
    }
    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount -= 1;
    }
    return value;
};

const formatCardNameForFile = (cardName) => {
    if (!cardName) return '';
    if (cardName === 'X') return '/cards/X.png';
    const card = cardName.toLowerCase().replace(' ', '_of_');
    return `/cards/${card}.png`;
};

function PlayerSeat({ player, isCurrentPlayer }) {
    const handValue = calculateHandValue(player.hand);
    const playerClass = isCurrentPlayer ? 'player-seat current-player' : 'player-seat';

    return (
        <div className={playerClass}>
            {isCurrentPlayer && <div className="turn-indicator">Your Turn</div>}
            
            <div className="player-info">
                <span className="player-name">{player.name}</span>
                {handValue > 0 && <span className="hand-value">{handValue}</span>}
            </div>
            <div className="card-hand">
                {player.hand.map((card, index) => (
                    <img
                        key={index}
                        src={formatCardNameForFile(card)}
                        alt={card}
                        className="card"
                        style={{ marginLeft: index > 0 ? '-60px' : '0' }}
                    />
                ))}
            </div>
        </div>
    );
}

export default PlayerSeat;