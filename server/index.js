const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 9999;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) =>{
  res.send("Backend server");
});

app.listen(PORT, () =>{
  console.log("App listening to 9999");
});
