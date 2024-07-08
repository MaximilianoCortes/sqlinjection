require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const logs = [];

// Configurar la conexión a la base de datos usando variables de entorno
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    multipleStatements: true 
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database.');
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static('public'));

app.get('/', (req, res) => {
    connection.query('SELECT * FROM users', (err, results) => {
        if (err) {
            console.error('Error during query:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.render('index', { user: null, users: results, message: null, logs: logs });
    });
});

// PETICION SEGURA
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?'; 
    console.log(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`); // Para propósitos de depuración

    connection.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error en la consulta SQL:', err);
            logs.push({ type: 'error', message: err.sqlMessage });
            return res.status(500).render('index', { user: null, users: [], message: 'Error en la consulta SQL', logs: logs });
        }

        logs.push({ type: 'query', message: `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'` });

        connection.query('SELECT * FROM users', (err, allUsers) => {
            if (err) {
                console.error('Error during query:', err);
                logs.push({ type: 'error', message: err.sqlMessage });
                return res.status(500).render('index', { user: null, users: [], message: 'Error en la consulta SQL', logs: logs });
            }

            logs.push({ type: 'query', message: 'SELECT * FROM users' });

            const message = results.length > 0 ? 'Inicio de sesion exitoso' : 'Credenciales Invalidas';
            logs.push({ type: 'info', message: message });

            res.render('index', { user: results[0], users: allUsers, message: message, logs: logs });
        });
    });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).send('Internal Server Error');
});

app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});
