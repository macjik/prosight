import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import router from './routes/index.js';
import bodyParser from 'body-parser';
import setupSwagger from './swagger.js';

const app = express();

setupSwagger(app);

app.use(express.json());
app.use(bodyParser.json());
app.use('/api', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Swagger docs at http://localhost:3010/api-docs');
});
