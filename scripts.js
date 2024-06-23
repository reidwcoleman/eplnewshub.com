const GIST_ID = 'c0f6f46e5df492379408eb54d9d1a34e';

document.addEventListener('DOMContentLoaded', (event) => {
    if (getCookie('voted') === 'true') {
        disableButtons();
        displayResults();
    }
    loadComments('poll');
});

function vote(team) {
    if (getCookie('voted') === 'true') {
        alert('You have already voted!');
        return;
    }
    
    votes[team]++;
    setCookie('voted', 'true', 30); // Cookie valid for 30 days
    displayResults();
    disableButtons();
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

function disableButtons() {
    const buttons = document.querySelectorAll('#poll-options button');
    buttons.forEach(button => {
        button.disabled = true;
    });
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Comments functionality
function addComment(event, section) {
    event.preventDefault();
    const comment = document.getElementById('comment').value;

    // Fetch the current comments from the Gist
    fetch(`https://api.github.com/gists/${GIST_ID}`)
        .then(response => response.json())
        .then(data => {
            let comments = JSON.parse(data.files['comments.json'].content) || [];
            comments.push({ comment, timestamp: new Date().toISOString() });
            // Update the Gist with the new comments
            updateComments(comments);
        })
        .catch(error => console.error('Error:', error));
}

function displayComments(section) {
    // Fetch the current comments from the Gist
    fetch(`https://api.github.com/gists/${GIST_ID}`)
        .then(response => response.json())
        .then(data => {
            let comments = JSON.parse(data.files['comments.json'].content) || [];
            let commentsHTML = '<h3>Comments:</h3>';
            comments.forEach(commentObj => {
                commentsHTML += `<p>${commentObj.comment}</p>`;
            });
            document.getElementById('comments').innerHTML = commentsHTML;
        })
        .catch(error => console.error('Error:', error));
}

function updateComments(comments) {
    // Update the Gist with the new comments
    fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({
            files: {
                'comments.json': {
                    content: JSON.stringify(comments)
                }
            }
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Comments updated:', data);
        displayComments('poll'); // Update the displayed comments after updating
    })
    .catch(error => console.error('Error updating comments:', error));
}
