// Show the popup form
function showPopup() {
    document.getElementById('popupForm').style.display = 'block';
}

// Close the popup form
function closePopup() {
    document.getElementById('popupForm').style.display = 'none';
}

// Handle form submission
document.getElementById('subscriptionForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;

    // Send data to the backend server
    fetch('/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, address })
    })
    .then(response => response.json())
    .then(data => {
        alert('Subscription successful!');
        closePopup();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while subscribing.');
    });
});
