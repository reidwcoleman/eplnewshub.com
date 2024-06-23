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
