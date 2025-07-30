# Prosight API Documentation

## 📌 Environment Variables (REQUIRED)
Create `.env` file in root directory with:

## 1. Clone repository
git clone https://github.com/macjik/prosight.git
cd prosight

## 2. Install dependencies
yarn install

## 3. Set up environment (if not using provided DB)
env
DB_URL=[DB_URL]
PORT=3010
JWT_SECRET=[yourToken]your secure token

cp .env.example .env
nano .env  # Edit with your credentials

## 4. Run with 
yarn start

## 5. Test with
yarn test

## 6. Swagger api path
{PATH}/api-docs
FOR EXAMPLE: http://localhost:3000/api-docs