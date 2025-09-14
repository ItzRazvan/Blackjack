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
  try{

    const tableQuery = await admin.firestore().collection('tables').where('name', '==', tablename).get();

    if(tableQuery.empty){
      throw new Error("Table doesnt exist");
    }

    try{
      const userProfileRef = admin.firestore().collection('users').doc(uid);

      if((await userProfileRef.get()).data()['active table'] != 'null'){
        throw error
      }

      await userProfileRef.update({
        'active table': tablename,
      })

    } catch (error) {
      throw error
    }

    const docRef = tableQuery.docs[0].ref;
    try{
      await docRef.update({
        'players': admin.firestore.FieldValue.increment(1),
        'players uid': admin.firestore.FieldValue.arrayUnion(uid)
      })

      await emitTables();
    } catch (error) {
      throw error
    }
  } catch (error) {
    throw error
  }
};

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

      await emitTables();

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

    await emitTables()
  } catch (error) {
      throw error
  }
};

function createDeck(){
  const cards = ["Hearts", "Diamonds", "Clubs", "Spades"];
  const values = [
    "A", "K", "Q", "J",
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
  activeTables.set(tablename, {
    name: tablename,
    players: await getPlayers(tableRef),
    deck: createDeck(),
    dealer: {
      hand: [],
      hasStood: false,
    }
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
  const tables = (await admin.firestore().collection("tables").where("state", "==", "waiting").get()).docs.map(doc => ({
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
      let playersArray = [];
      const tableQuery = await admin.firestore().collection('tables').where('name', '==', tablename).get();
      if (!tableQuery.empty) {
        const tableRef = tableQuery.docs[0];
        const playersUids = tableRef.data()['players uid']
          for (const uid of playersUids){
            const player = await admin.firestore().collection('users').doc(uid).get();
            playersArray.push({
              username: player.data()['username'],
              uid: uid,
          });
        }
      }
      return playersArray
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
      io.to(data.tablename).emit("start");
    } catch(error) {
      socket.emit('error', error.message);
    }
  })
});

server.listen(PORT, () =>{
  console.log(`App listening to ${PORT}`);
});