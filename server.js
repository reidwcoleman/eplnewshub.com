const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

let votes = {
    france: 0,
    england: 0,
    spain: 0,
    germany: 0
};

app.get('/results', (req, res) => {
    res.json(votes);
});

app.post('/vote', (req, res) => {
    const team = req.body.team;
    if (votes[team] !== undefined) {
        votes[team] += 1;
        res.status(200).send('Vote counted');
    } else {
        res.status(400).send('Invalid team');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
