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

async function joinTable(tablename) {
  try{

    const tableQuery = await admin.firestore().collection('tables').where('name', '==', tablename).get();

    if(tableQuery.empty){
      console.log("table doesnt exit");
      throw new Error("table doestn exist");
    }

    try{
      const userProfileRef = admin.firestore().collection('users').doc(decodedToken.uid);

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
        players: admin.firestore.FieldValue.increment(1)
      })

      await emitTables();
    } catch (error) {
      throw error
    }
  } catch (error) {
    throw error
  }
};

async function leaveTable(tablename){ 
  try{

    const tableQuery = await admin.firestore().collection("tables").where('name', '==', tablename).get();

    if(tableQuery.empty){
      throw new Error("table doesnt exist")
    }

    try {
      const userProfileRef = admin.firestore().collection('users').doc(decodedToken.uid);

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
        players: admin.firestore.FieldValue.increment(-1),
      });

      const updatedDoc = await docRef.get();
      const players = await updatedDoc.data().players;

      if(players == 0){
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

async function createTable(tableName){
  try {
   
    const timestamp = admin.firestore.Timestamp.now();

    const tableQuery = await admin.firestore().collection('tables').where("name", "==", tableName).get();

    if(!tableQuery.empty) {
      throw new Error("Table already exists")
    }

    await admin.firestore().collection("tables").add({
      'name': tableName,
      'players': 0,
      'state': 'waiting',
      'created at': timestamp,
      'created by': decodedToken.uid,
    })
    await emitTables()
  } catch (error) {
      throw error
  }
};


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
  const tables = (await admin.firestore().collection("tables").get()).docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  if (socket) {
    socket.emit("tables", tables);
  } else {
    io.to("tables room").emit("tables", tables);
  }
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
      await createTable(data.tablename);
      socket.emit("tableReady");
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  socket.on("joinTable", async (data) => {
    try{
      await joinTable(data.tablename);
      socket.join(data.tablename);
    } catch (error) {
      socket.emit("error" ,error.message);
    }
  });

  socket.on("leaveTable", async(data) => {
    try{
      await leaveTable(data.tablename);
      socket.leave(data.tablename);
    } catch(error){
      socket.emit("error", error.message);
    }
  })
});

server.listen(PORT, () =>{
  console.log(`App listening to ${PORT}`);
});