import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import router from './routes/index.js';
import bodyParser from 'body-parser';

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use('/api', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
