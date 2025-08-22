import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './db/db.js';
import router from './routes/index.js';

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/v1', router);

app.get('/', (req, res) => {
  res.send('Welcome to the Paytm Backend!');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

