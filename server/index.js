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

app.post(process.env.JOIN_TABLE_ENDPOINT, async (req, res) => {
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401);
  }
  const idToken = authHeader.split(' ')[1];   

  try{
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const tablename = req.params.tablename;

    const tableQuery = await admin.firestore().collection('tables').where('name', '==', tablename).get();

    if(tableQuery.empty){
      return res.status(401).send("Table doesnt exist");
    }

    try{
      const userProfileRef = admin.firestore().collection('users').doc(decodedToken.uid);

      if((await userProfileRef.get()).data()['active table'] != 'null'){
        return res.status(401);
      }

      await userProfileRef.update({
        'active table': tablename,
      })

    } catch (error) {
      return res.status(401);
    }

    const docRef = tableQuery.docs[0].ref;
    try{
      await docRef.update({
        players: admin.firestore.FieldValue.increment(1)
      })

      await emitTables();
    } catch (error) {
      res.status(401);
    }

    res.status(201);
  } catch (error) {
    res.status(401);
  }
});

app.post(process.env.LEAVE_TABLE_ENDPOINT, async (req, res) => {
  authHeader = req.headers.authorization;
  if(!authHeader){  
    return res.status(401);
  }
  const idToken = authHeader.split(' ')[1];

  try{
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const tablename = req.params.tablename;

    const tableQuery = await admin.firestore().collection("tables").where('name', '==', tablename).get();

    if(tableQuery.empty){
      return res.status(401);
    }

    try {
      const userProfileRef = admin.firestore().collection('users').doc(decodedToken.uid);

      if((await userProfileRef.get()).data()['active table'] == 'null'){
        return res.status(401);
      }

      await userProfileRef.update({
        'active table': 'null',
      });

    } catch (error) {
      return res.status(401);
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
      return res.status(401);
    }

    res.status(201);

  } catch (error) {
    res.status(401);
  }
});

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

app.post(process.env.CREATE_TABLE_ENDPOINT, async (req, res) => {
    const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401);
  }
  const idToken = authHeader.split(' ')[1];

  const tableName = req.query.tablename;
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const timestamp = admin.firestore.Timestamp.now();

    const tableQuery = await admin.firestore().collection('tables').where("name", "==", tableName).get();

    if(!tableQuery.empty) {
      return res.status(401).send("Table already exists");
    }

    await admin.firestore().collection("tables").add({
      'name': tableName,
      'players': 0,
      'state': 'waiting',
      'created at': timestamp,
      'created by': decodedToken.uid,
    })

    await emitTables();

    res.status(201).send('Table created');
  } catch (error) {
    res.status(401);
  }
});

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
      await socket.join("tables room");
      await emitTables(socket);
  });

  
  socket.on("requestTables", async () => {
    await emitTables(socket);
  })

  socket.on("leaveTablesRoom", async () => {
    await socket.leave("tables room");
  });
});

server.listen(PORT, () =>{
  console.log(`App listening to ${PORT}`);
});