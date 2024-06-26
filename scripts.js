// script.js

document.getElementById('pollForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const selectedTeam = formData.get('team');
    
    if (selectedTeam) {
        const franceVotes = localStorage.getItem('france') || 0;
        const englandVotes = localStorage.getItem('england') || 0;
        const spainVotes = localStorage.getItem('spain') || 0;
        const germanyVotes = localStorage.getItem('germany') || 0;

        if (selectedTeam === 'France') {
            localStorage.setItem('france', parseInt(franceVotes) + 1);
        } else if (selectedTeam === 'England') {
            localStorage.setItem('england', parseInt(englandVotes) + 1);
        } else if (selectedTeam === 'Spain') {
            localStorage.setItem('spain', parseInt(spainVotes) + 1);
        } else if (selectedTeam === 'Germany') {
            localStorage.setItem('germany', parseInt(germanyVotes) + 1);
        }

        document.getElementById('france').innerText = localStorage.getItem('france');
        document.getElementById('england').innerText = localStorage.getItem('england');
        document.getElementById('spain').innerText = localStorage.getItem('spain');
        document.getElementById('germany').innerText = localStorage.getItem('germany');
        document.getElementById('poll').classList.add('hidden');
        document.getElementById('results').classList.remove('hidden');
    }
});

window.addEventListener('load', function() {
    document.getElementById('france').innerText = localStorage.getItem('france') || 0;
    document.getElementById('england').innerText = localStorage.getItem('england') || 0;
    document.getElementById('spain').innerText = localStorage.getItem('spain') || 0;
    document.getElementById('germany').innerText = localStorage.getItem('germany') || 0;
});
