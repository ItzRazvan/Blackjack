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

const tables = [
  { id: 1, name: 'Table 1', players: 2 },
  { id: 2, name: 'Table 2', players: 1 },
];

app.get(process.env.AVAILABLE_TABLES_ENDPOINT, (req, res) =>{
  res.json(tables);
});

app.post(process.env.JOIN_TABLE_ENDPOINT, async (req, res) => {
  const tableId = req.params.id;
  console.log("Join game:", tableId);
  res.status(201);
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
    })

    res.status(201);
  } catch (error) {
    res.status(401);
  }
});

app.listen(PORT, () =>{
  console.log("App listening to 9999");
});
