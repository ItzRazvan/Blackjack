require('dotenv').config();

const admin  = require("firebase-admin");
const serviceAccount = require("./serviceAccKey.json");

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 9999;

app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const activeTables = new Map();

async function joinTable(tablename, uid) {
  const db = admin.firestore();

  await db.runTransaction(async (t) => {
    const userRef = db.collection('users').doc(uid);
    const tableQuery = await t.get(db.collection('tables').where('name', '==', tablename).limit(1));

    if (tableQuery.empty) {
      throw new Error("Table doesn't exist");
    }

    const tableRef = tableQuery.docs[0].ref;
    const userSnap = await t.get(userRef);

    if (userSnap.data()['active table'] !== 'null') {
      throw new Error("User already in a table");
    }

    t.update(userRef, { 'active table': tablename });
    t.update(tableRef, {
      players: admin.firestore.FieldValue.increment(1),
      'players uid': admin.firestore.FieldValue.arrayUnion(uid)
    });
  });
  emitTables();
}


async function leaveTable(tablename, uid){ 
  try{

    const tableQuery = await admin.firestore().collection("tables").where('name', '==', tablename).get();

    if(tableQuery.empty){
      throw new Error("table doesnt exist")
    }

    try {
      const userProfileRef = admin.firestore().collection('users').doc(uid);

      if((await userProfileRef.get()).data()['active table'] == 'null'){
        throw new Error("User doesent exist");
      }

      await userProfileRef.update({
        'active table': 'null',
      });

    } catch (error) {
      throw error
    }

    const docRef = tableQuery.docs[0].ref;

    try {
      await docRef.update({
        'players': admin.firestore.FieldValue.increment(-1),
        'players uid': admin.firestore.FieldValue.arrayRemove(uid)
      });

      const updatedDoc = await docRef.get();
      const players = await updatedDoc.data().players;

      if(players <= 0){
        activeTables.delete(tablename);
        await docRef.delete();
      }

      emitTables();

    } catch (error) {
      throw error
    }

  } catch (error) {
    throw error
  }
};

app.post(process.env.ADD_USER_ENDPOINT, async (req, res) => {
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401);
  }
  const idToken = authHeader.split(' ')[1];    
  try{
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const timestamp = admin.firestore.Timestamp.now();

    await admin.firestore().collection("users").doc(decodedToken.uid).set({
      'username': decodedToken.name,
      'email': decodedToken.email,
      'balance' : 1000,
      'games played': 0,
      'games won': 0,
      'created at': timestamp,
      'last login': timestamp,
      'active table': 'null',
    })

    res.status(201);
  } catch (error) {
    res.status(401);
  }
});

app.post(process.env.UPDATE_LAST_LOGIN_ENDPOINT, async (req, res) => {
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401);
  }
  const idToken = authHeader.split(' ')[1];    
  try{
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const timestamp = admin.firestore.Timestamp.now();

    await admin.firestore().collection('users').doc(decodedToken.uid).update({
      'last login': timestamp,
    });

    res.status(201);
  } catch (error){
    res.status(401);
  }
})

async function createTable(tablename, uid){
  try {
   
    const timestamp = admin.firestore.Timestamp.now();

    const tableQuery = await admin.firestore().collection('tables').where("name", "==", tablename).get();

    if(!tableQuery.empty) {
      throw new Error("Table already exists")
    }

    await admin.firestore().collection("tables").add({
      'name': tablename,
      'players': 0,
      'players uid': [],
      'state': 'waiting',
      'created at': timestamp,
      'created by': uid,
    })

    emitTables()
  } catch (error) {
      throw error
  }
};

function createDeck(){
  const cards = ["Hearts", "Diamonds", "Clubs", "Spades"];
  const values = [
    "Ace", "King", "Queen", "Jack",
    "2", "3", "4", "5", "6", "7", "8", "9", "10",
  ]
  let deck = [];

  for(let card in cards){
    for(let value in values) {
      deck.push(values[value] + " " + cards[card]);
    }
  }
  for(let i = deck.length - 1; i > 0; i--){
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck
}

async function getPlayers(tableRef){
  const players = new Map();
  try{
    const playersUids = tableRef.data()['players uid']
    for (const uid of playersUids){
      const player = await admin.firestore().collection('users').doc(uid).get();

      players.set(uid, {
        uid: uid,
        name: player.data()['username'],
        balance: player.data()['balance'],
        hand: [],
        bet: 0,
        hasStood: false,
      })
    }
    return players
  } catch (error){
    throw error
  }
}

async function createGameState(tablename, tableRef) {
  const playersMap = await getPlayers(tableRef);
  const turnOrder = Array.from(playersMap.keys());
  activeTables.set(tablename, {
    name: tablename,
    players: playersMap,
    deck: createDeck(),
    dealer: {
      hand: [],
      hasStood: false,
    },
    turnOrder: turnOrder,
    currentTurnIndex: 0,
  })
  console.log(activeTables);
}

async function startGame(tablename, uid){
  try { 
    const tableQuery = await admin.firestore().collection("tables").where("name", "==", tablename).get();

    if(tableQuery.empty){
      throw new Error("Table doesn't exist");
    }

    const tableRef = tableQuery.docs[0];
    if(uid != tableRef.data()['created by']){
       throw new Error("Only the table creator can start the game.");
    }

    if(tableRef.data()['state'] != 'waiting'){
      throw new Error("Table isn't waiting");
    }

    await createGameState(tablename, tableRef);

    await tableRef.ref.update({
      state: 'started'
    });

    emitTables();
  } catch (error) {
    throw error
  }
}


const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*", 
  }
})

io.use(async(socket, next) => {
  const token = socket.handshake.auth.token;

  if(!token){
    return next(new Error("Authentication failed: No Token provided"));
  }

  try {
    decodedToken = await admin.auth().verifyIdToken(token);

    socket.data.user = decodedToken;
    next();
  } catch (error) {
    return next(new Error("Authenticaion error: Invalid token"));
  }
})


async function emitTables(socket = null) {
  const tables = (await admin.firestore().collection("tables").where("state", "==", "waiting").where("players", "<", 8).get()).docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  if (socket) {
    socket.emit("tables", tables);
  } else {
    io.to("tables room").emit("tables", tables);
  }
}

async function getPlayerName(tablename){
  const tableQuery = await admin.firestore().collection('tables').where('name', '==', tablename).get();
  if (tableQuery.empty) return [];
  const tableRef = tableQuery.docs[0];
  const playersUids = tableRef.data()['players uid'];
  if (!playersUids.length) return [];
  const userRefs = playersUids.map(uid => admin.firestore().collection('users').doc(uid));
  const userDocs = await admin.firestore().getAll(...userRefs);
  return userDocs.map((doc, idx) => ({
    username: doc.data()?.username || '',
    uid: playersUids[idx],
  }));
}

io.on("connection", async (socket) => {

  socket.on("joinTablesRoom", async () => {
      try{
        await socket.join("tables room");
        await emitTables(socket);
      } catch(error){
        socket.emit("error", error.message);
      }
  });

  
  socket.on("requestTables", async () => {
    try{
      await emitTables(socket);
    } catch(error){
      socket.emit("error". error.message);
    }
  })


  socket.on("createTable", async (data) => {
    try{
      await createTable(data.tablename, socket.data.user.uid);
      socket.emit("tableReady");
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("joinTable", async (data) => {
    try{
      await joinTable(data.tablename, socket.data.user.uid);
      socket.join(data.tablename);
      io.to(data.tablename).emit("players", { players: await getPlayerName(data.tablename) });
    } catch (error) {
      socket.emit("error" ,error.message);
    }
  });

  socket.on("leaveTable", async(data) => {
    try{
      await leaveTable(data.tablename, socket.data.user.uid);
      socket.leave(data.tablename);
      io.to(data.tablename).emit("players", { players: await getPlayerName(data.tablename) });
    } catch(error){
      socket.emit("error", error.message);
    }
  })

  socket.on("startGame", async (data) => {
    try{
      await startGame(data.tablename, socket.data.user.uid);
      io.to(data.tablename).emit("bettingPhaseStart");
    } catch(error) {
      socket.emit('error', error.message);
    }
  })

  socket.on("placeBet", async (data) => {
    try {
      const tableState = activeTables.get(data.tablename);
      if (!tableState || !tableState.players || !tableState.players.has(socket.data.user.uid)) {
        socket.emit("error", "Table or player not found.");
        return;
      }
      const player = tableState.players.get(socket.data.user.uid);
      if (typeof data.bet !== "number" || data.bet <= 0) {
        socket.emit("error", "Invalid bet amount.");
        return;
      }
      if(player.bet != 0){
        socket.emit("error", "Bet already placed.");
        return;
      }
      if (data.bet > player.balance) {
        socket.emit("notEnoughMoney");
        return;
      }
      await updatePlayerBalance(socket.data.user.uid, data.bet);
      player.balance -= data.bet;
      player.bet = data.bet;
      tableState.players.set(socket.data.user.uid, player);
      activeTables.set(data.tablename, tableState);
      socket.emit("betPlaced");

      const allBetsPlaced = Array.from(tableState.players.values()).every(player => player.bet > 0);
      if(allBetsPlaced){
        dealCards(data.tablename);
        const cards = getCards(data.tablename, false);
        io.to(data.tablename).emit("dealCards", cards);

        io.to(data.tablename).emit("playerTurn", {uid: tableState.turnOrder[tableState.currentTurnIndex]})
      }
    } catch (error) {
      socket.emit("error", error.message);
    }
  });
  

    socket.on("hit", async (data) => {
      const tableState = activeTables.get(data.tablename);
      if(!tableState) return;
      const currentUid = tableState.turnOrder[tableState.currentTurnIndex];
      if(socket.data.user.uid !== currentUid) return;

      const player = tableState.players.get(currentUid);

      player.hand.push(tableState.deck.pop());

      if(handSum(player.hand) > 21) {
          player.hasStood = true;

          tableState.players.set(currentUid, player);
          activeTables.set(data.tablename, tableState); 

          const cards = getCards(data.tablename, false);
          io.to(data.tablename).emit("updateCards", cards);

          await nextPlayerTurn(data.tablename);
       }else{

          const cards = getCards(data.tablename, false);
          io.to(data.tablename).emit("updateCards", cards);
       }
      });

    socket.on('stand', async (data) => {
      const tableState = activeTables.get(data.tablename);
      if(!tableState) return;
      const currentUid = tableState.turnOrder[tableState.currentTurnIndex];
      if(socket.data.user.uid !== currentUid) return;

      const player = tableState.players.get(currentUid);
      player.hasStood = true;

      tableState.players.set(currentUid, player);
      activeTables.set(data.tablename, tableState); 

      await nextPlayerTurn(data.tablename);
    })
});

function getWinners(tablename, allBusted){
  const tableState = activeTables.get(tablename);
  const players = tableState.players.values();
  const dealer = tableState.dealer;
  let winners = [];

  let bestHand = 0;
  if(!allBusted){
    for(const player of players){
      const sum = handSum(player.hand);
      if(sum <= 21 && sum > bestHand){
        bestHand = sum;
        winners = [];
        winners.push({uid: player.uid, name: player.name});
      }else if(sum == bestHand){
        winners.push({uid: player.uid, name: player.name});
      }
    }
  }

  if(allBusted){
    winners.push({uid: 'dealer', name: 'dealer'});
    return winners;
  }else{
    let dealerSum = handSum(dealer.hand);
    if(dealerSum <= 21 && dealerSum > bestHand){
      bestHand = dealerSum;
      winners = [];
      winners.push({uid: 'dealer', name: 'dealer'});
    }else if(dealerSum == bestHand){
      winners.push({uid: 'dealer', name: 'dealer'});
    }
  }

  return winners;
}

async function giveortakeMoney(tablename, winners){
  const tableState = activeTables.get(tablename);
  const playerNumber = tableState.players.size + 1;
  const moneyPerPlayer = Math.round((playerNumber * 100) / winners.length);

  for(const player of tableState.players.values()){
    const isWinner = winners.some(winner => winner.uid === player.uid);
    if(!isWinner){
    console.log(player);
      const playerRef = admin.firestore().collection("users").doc(player.uid);
      await playerRef.update({
        'games played': admin.firestore.FieldValue.increment(1),
      });
    }
  }

  for(const winner of winners){
    if(winner.uid !== 'dealer'){
      const playerRef = admin.firestore().collection("users").doc(winner.uid);
      await playerRef.update({
        'balance': admin.firestore.FieldValue.increment(moneyPerPlayer),
        'games won': admin.firestore.FieldValue.increment(1),
        'games played': admin.firestore.FieldValue.increment(1),
    })
    }
  }
}

async function endGame(tablename, allBusted){
  const winners = getWinners(tablename, allBusted);

  io.to(tablename).emit("endGame", winners);

  await giveortakeMoney(tablename, winners);

  await sleep(6000);

  io.to(tablename).emit("gameEnded");

  const room = io.sockets.adapter.rooms.get(tablename);
  if (room) {
    for (const socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(tablename);
      }
    }
  }
  activeTables.delete(tablename);
}

function handSum(hand) {
  let sum = 0;
  let aceCount = 0;

  for (const card of hand) {
    const value = card.split(' ')[0];

    switch (value) {
      case 'Ace':
        aceCount++;
        sum += 11;
        break;
      case 'Jack':
      case 'Queen':
      case 'King':
        sum += 10;
        break;
      default:
        sum += parseInt(value);
        break;
    }
  }

  while (sum > 21 && aceCount > 0) {
    sum -= 10;
    aceCount--;
  }

  return sum;
}

async function nextPlayerTurn(tablename){
  const tableState = activeTables.get(tablename);
  if(!tableState) return;

  let nextIndex = tableState.currentTurnIndex + 1;
  if (nextIndex < tableState.turnOrder.length) {
    tableState.currentTurnIndex = nextIndex;
    activeTables.set(tablename, tableState);
    const nextUid = tableState.turnOrder[nextIndex];
    io.to(tablename).emit("playerTurn", { uid: nextUid });
  } else {
    io.to(tablename).emit("allPlayersStood");
    await dealDealer(tablename);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function dealDealer(tablename){
    const tableState = activeTables.get(tablename);
    const dealerHand = tableState.dealer.hand;

    let allBusted = true;

    for(const player of tableState.players.values()){
      if(handSum(player.hand) <= 21){
        allBusted = false;
      }
    }

    if(allBusted){
      return endGame(tablename, allBusted);
    }

    io.to(tablename).emit("updateCards", getCards(tablename, true));

    await sleep(1500);

    while(handSum(dealerHand) < 17){
      dealerHand.push(tableState.deck.pop());
      activeTables.set(tablename, tableState); 

      io.to(tablename).emit("updateCards", getCards(tablename, true));

      await sleep(1500);
    }

    tableState.dealer.hasStood = true;
    activeTables.set(tablename, tableState); 

    endGame(tablename, allBusted);
}

function getCards(tablename, allPlayersStood){
  const tableState = activeTables.get(tablename);

  let cards = [];

  for(const [uid, player] of tableState.players.entries()){
    cards.push({
      uid: uid,
      name: player.name,
      hand: player.hand
    });
  }

  let dealerHand = [];
  if(!allPlayersStood){
    if (tableState.dealer.hand.length > 0) {
      dealerHand.push(tableState.dealer.hand[0]);
      dealerHand.push("X");
    }
  }else{
    for(const card of tableState.dealer.hand){
      dealerHand.push(card);
    }
  }
  cards.push({
    uid: "dealer",
    name: "dealer",
    hand: dealerHand,
  });

  return cards;
}

function dealCards(tablename){
  const tableState = activeTables.get(tablename);

  for(const player of tableState.players.values()){
    player.hand = [
      tableState.deck.pop(),
      tableState.deck.pop()
    ];
  }

  tableState.dealer.hand = [
    tableState.deck.pop(),
    tableState.deck.pop()
  ];

  activeTables.set(tablename, tableState);

  console.log(tableState.players.values());
}

async function updatePlayerBalance(uid, bet){
  try{
    const playerRef = admin.firestore().collection("users").doc(uid);
    await playerRef.update({
      'balance': admin.firestore.FieldValue.increment(bet * (-1)),
    });
  } catch (error){
    return error;
  }
}

server.listen(PORT, () =>{
  console.log(`App listening to ${PORT}`);
});