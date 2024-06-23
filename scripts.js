<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TVPLGM5QY9"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-TVPLGM5QY9');
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reid's Soccer News Community</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="icon" type="image/x-icon" href="reidsnsmall.png">
</head>
<body>
    <header>
        <div class="header_container">
            <img src="reids_soccer_news_logo.png" style="width: 11%; height: auto; float: left; padding-right:15px;">
            <h1>Welcome to EPL News Hub Community</h1>
            <nav>
                <ul>
                    <li><a href="index.html#home">Home</a></li>
                    <li><a href="index.html#about">About</a></li>
                    <li><a href="index.html#articles">Articles</a></li>
                    <li><a href="community.htmlcommunity">Community</a></li>
                </ul>
            </nav>
        </div>
    </header>
    
    <main>
        <section id="community">
            <h2>Euros Poll</h2>
            <p>Which Team Do You Think Will Win the Euros This Season?</p>
            <div id="poll-options">
                <button onclick="vote('Spain')">Spain</button>
                <button onclick="vote('Germany')">Germany</button>
                <button onclick="vote('England')">England</button>
                <button onclick="vote('France')">France</button>
            </div>
            <div id="poll-results"></div>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 Reid's Soccer News</p>
    </footer>

    <script>
        const GIST_ID = '4e0ec7226e86b66dc9e40e84988db67e';
        let votes = {};
        let hasVoted = false;

        document.addEventListener('DOMContentLoaded', (event) => {
            loadVotes();
        });

        function loadVotes() {
            fetch(`https://api.github.com/gists/${GIST_ID}`)
                .then(response => response.json())
                .then(data => {
                    const content = data.files['votes.json'].content;
                    votes = JSON.parse(content);
                    hasVoted = checkIfVoted();
                    displayResults();
                })
                .catch(error => console.error('Error:', error));
        }

        function checkIfVoted() {
            // You can implement your own logic here to check if the user has voted
            // For now, let's just return false
            return false;
        }

        function vote(team) {
            if (!hasVoted) {
                if (!votes[team]) {
                    votes[team] = 1;
                } else {
                    votes[team]++;
                }
                hasVoted = true;
                updateVotes();
            } else {
                alert('You have already voted!');
            }
        }

        function updateVotes() {
            fetch(`https://api.github.com/gists/${GIST_ID}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    files: {
                        'votes.json': {
                            content: JSON.stringify(votes)
                        }
                    }
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log('Votes updated:', data);
                displayResults(); // Update the displayed results after updating votes
            })
            .catch(error => console.error('Error updating votes:', error));
        }

        function displayResults() {
            let totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
            let resultsHTML = '<h3>Poll Results:</h3>';
            for (let team in votes) {
                let percentage = totalVotes ? ((votes[team] / totalVotes) * 100).toFixed(2) : 0;
                resultsHTML += `<p>${team}: ${votes[team]} vote(s) (${percentage}%)</p>`;
            }
            document.getElementById('poll-results').innerHTML = resultsHTML;
        }
    </script>
</body>
</html>
