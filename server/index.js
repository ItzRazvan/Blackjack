const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 9999;

app.use(cors());
app.use(express.json());

const tables = [
  { id: 1, name: 'Table 1', players: 2 },
  { id: 2, name: 'Table 2', players: 1 },
];


app.get('/api/availableTables', (req, res) =>{
  res.json(tables);
});

app.post('/api/joinTable/:id', (req, res) => {
  const tableId = req.params.id;
  console.log("Join game:", tableId);
});

app.listen(PORT, () =>{
  console.log("App listening to 9999");
});
