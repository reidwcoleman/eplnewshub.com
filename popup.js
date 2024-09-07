// Get the modal
var popupBox = document.getElementById("popupBox");

// Get the button that opens the modal
var openPopup = document.getElementById("openPopup");

// Get the <span> element that closes the modal
var closePopup = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the popup
openPopup.onclick = function() {
  popupBox.style.display = "block";
}

// When the user clicks on <span> (x), close the popup
closePopup.onclick = function() {
  popupBox.style.display = "none";
}

// When the user clicks anywhere outside of the popup, close it
window.onclick = function(event) {
  if (event.target == popupBox) {
    popupBox.style.display = "none";
  }
}

// Handle form submission
document.getElementById("emailForm").addEventListener("submit", function(event) {
  event.preventDefault();
  
  // Get the email input value
  var email = document.getElementById("userEmail").value;
  
  // Simulate sending the data to a server (this could be replaced with an AJAX call)
  console.log("Email submitted:", email);
  
  // You can display a message to the user after submission
  document.getElementById("responseMessage").style.display = "block";
  document.getElementById("responseMessage").innerText = "Thank you! We have received your email.";
  
  // Clear the input field
  document.getElementById("userEmail").value = '';
  
  // Optionally close the popup after submission
  popupBox.style.display = "none";
});
