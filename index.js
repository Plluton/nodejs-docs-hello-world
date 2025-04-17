// ***************************************************************************
// Bank API code from Web Dev For Beginners project
// https://github.com/microsoft/Web-Dev-For-Beginners/tree/main/7-bank-project/api
// ***************************************************************************

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const pkg = require('./package.json');

// App constants
const port = process.env.PORT || 3000;
const apiPrefix = '/api';

// Store data in-memory, not suited for production use!
const db = {
  test: {
    user: 'test',
    currency: '$',
    description: `Test account`,
    balance: 75,
    transactions: [
      { id: '1', date: '2020-10-01', object: 'Pocket money', amount: 50 },
      { id: '2', date: '2020-10-03', object: 'Book', amount: -10 },
      { id: '3', date: '2020-10-04', object: 'Sandwich', amount: -5 }
    ],
  },
  jondoe: {
    user: 'jondoe',
    currency: '$',
    description: `Second test account`,
    balance: 150,
    transactions: [
      { id: '1', date: '2022-10-01', object: 'Gum', amount: -2 },
      { id: '2', date: '2022-10-03', object: 'Book', amount: -10 },
      { id: '3', date: '2022-10-04', object: 'Restaurant', amount: -45 }
    ],
  }
};

// Create the Express app & setup middlewares
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({ origin: /http:\/\/(127(\.\d){3}|localhost)/ }));
app.options('*', cors());

// ***************************************************************************

// Configure routes
const router = express.Router();

// Hello World for index page (modifié pour inclure un GIF)
app.get('/', function (req, res) {
  return res.send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <title>Bienvenue</title>
          <style>
              body {
                  text-align: center;
                  font-family: Arial, sans-serif;
                  margin-top: 50px;
              }
              img {
                  max-width: 400px;
                  height: auto;
              }
          </style>
      </head>
      <body>
          <h1>Hello World! 👋</h1>
          <img src="https://www.icegif.com/wp-content/uploads/2023/01/icegif-162.gif" alt="Funny GIF">
      </body>
      </html>
  `);
});

app.get('/api', function (req, res) {
  return res.send("Fabrikam Bank API");
});

// ----------------------------------------------
// Create an account
router.post('/accounts', (req, res) => {
  if (!req.body.user || !req.body.currency) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  if (db[req.body.user]) {
    return res.status(409).json({ error: 'User already exists' });
  }

  let balance = req.body.balance;
  if (balance && typeof balance !== 'number') {
    balance = parseFloat(balance);
    if (isNaN(balance)) {
      return res.status(400).json({ error: 'Balance must be a number' });
    }
  }

  const account = {
    user: req.body.user,
    currency: req.body.currency,
    description: req.body.description || `${req.body.user}'s budget`,
    balance: balance || 0,
    transactions: [],
  };
  db[req.body.user] = account;

  return res.status(201).json(account);
});

// ----------------------------------------------
// Get all data for the specified account
router.get('/accounts/:user', (req, res) => {
  const account = db[req.params.user];
  if (!account) {
    return res.status(404).json({ error: 'User does not exist' });
  }

  return res.json(account);
});

// ----------------------------------------------
// Remove specified account
router.delete('/accounts/:user', (req, res) => {
  const account = db[req.params.user];
  if (!account) {
    return res.status(404).json({ error: 'User does not exist' });
  }

  delete db[req.params.user];
  res.sendStatus(204);
});

// ----------------------------------------------
// Add a transaction to a specific account
router.post('/accounts/:user/transactions', (req, res) => {
  const account = db[req.params.user];
  if (!account) {
    return res.status(404).json({ error: 'User does not exist' });
  }

  if (!req.body.date || !req.body.object || !req.body.amount) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  let amount = req.body.amount;
  if (amount && typeof amount !== 'number') {
    amount = parseFloat(amount);
  }

  if (amount && isNaN(amount)) {
    return res.status(400).json({ error: 'Amount must be a number' });
  }

  const id = crypto
    .createHash('md5')
    .update(req.body.date + req.body.object + req.body.amount)
    .digest('hex');

  if (account.transactions.some((transaction) => transaction.id === id)) {
    return res.status(409).json({ error: 'Transaction already exists' });
  }

  const transaction = {
    id,
    date: req.body.date,
    object: req.body.object,
    amount,
  };
  account.transactions.push(transaction);
  account.balance += transaction.amount;

  return res.status(201).json(transaction);
});

// ----------------------------------------------
// Remove specified transaction from account
router.delete('/accounts/:user/transactions/:id', (req, res) => {
  const account = db[req.params.user];
  if (!account) {
    return res.status(404).json({ error: 'User does not exist' });
  }

  const transactionIndex = account.transactions.findIndex(
    (transaction) => transaction.id === req.params.id
  );

  if (transactionIndex === -1) {
    return res.status(404).json({ error: 'Transaction does not exist' });
  }

  account.transactions.splice(transactionIndex, 1);
  res.sendStatus(204);
});

// ***************************************************************************

// Add 'api` prefix to all routes
app.use(apiPrefix, router);

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});