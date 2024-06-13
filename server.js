require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const uri = process.env.MONGO_URI;

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

(async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("CONNECTED TO DATABASE SUCCESSFULLY");
  } catch (error) {
    console.error('COULD NOT CONNECT TO DATABASE:', error.message);
  }
})();

const route = require('./src/routes/routes');
app.use('/api', route);

app.get('/', (req, res) => {
  res.send('API is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
