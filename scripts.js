let votes = {
    'Team A': 0,
    'Team B': 0,
    'Team C': 0,
    'Team D': 0
};

function vote(team) {
    votes[team]++;
    displayResults();
}

function displayResults() {
    let totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
    let resultsHTML = '<h3>Poll Results:</h3>';
    for (let team in votes) {
        let percentage = totalVotes ? (votes[team] / totalVotes * 100).toFixed(2) : 0;
        resultsHTML += `<p>${team}: ${votes[team]} vote(s) (${percentage}%)</p>`;
    }
    document.getElementById('poll-results').innerHTML = resultsHTML;
}
