document.addEventListener('DOMContentLoaded', () => {
    const openPopup = document.getElementById('openPopup');
    const popupBox = document.getElementById('popupBox');
    const closePopup = document.querySelector('.close');

    openPopup.addEventListener('click', () => {
        popupBox.style.display = 'flex';
    });

    closePopup.addEventListener('click', () => {
        popupBox.style.display = 'none';
    });

    // Close popup when clicking outside the content
    popupBox.addEventListener('click', (e) => {
        if (e.target === popupBox) {
            popupBox.style.display = 'none';
        }
    });

    // Close popup with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && popupBox.style.display === 'flex') {
            popupBox.style.display = 'none';
        }
    });
});
