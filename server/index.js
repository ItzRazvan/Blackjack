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

app.get(process.env.AVAILABLE_TABLES_ENDPOINT, async (req, res) =>{
  const tables = (await admin.firestore().collection("tables").get()).docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  res.json(tables);
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

    const docRef = tableQuery.docs[0];
    try{
      await docRef.ref.update({
        players: admin.firestore.FieldValue.increment(1)
      })
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

    res.status(201).send('Table created');
  } catch (error) {
    res.status(401);
  }
});

app.listen(PORT, () =>{
  console.log("App listening to 9999");
});
