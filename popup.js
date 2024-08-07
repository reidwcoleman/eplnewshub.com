window.onload = function() {
    setTimeout(function() {
        document.getElementById('popupOverlay').style.display = 'flex';
    }, 5000); // Adjust the delay time (in milliseconds) as needed
}

document.getElementById('closePopup').addEventListener('click', function() {
    document.getElementById('popupOverlay').style.display = 'none';
});
