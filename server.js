const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

let comments = {
    poll: [],
    article: []
};

app.post('/comments', (req, res) => {
    const { section, comment } = req.body;
    if (comments[section]) {
        comments[section].push(comment);
        res.status(200).send({ message: 'Comment added successfully' });
    } else {
        res.status(400).send({ message: 'Invalid section' });
    }
});

app.get('/comments', (req, res) => {
    const { section } = req.query;
    if (comments[section]) {
        res.status(200).send(comments[section]);
    } else {
        res.status(400).send({ message: 'Invalid section' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
