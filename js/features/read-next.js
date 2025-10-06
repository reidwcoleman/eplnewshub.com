// Read Next Sidebar Component
document.addEventListener('DOMContentLoaded', function() {
    // Articles that would be pushed off from secondary subheadlines
    const readNextArticles = [
        {
            title: "Arsenal's £95m Gyökeres Swoop Signals Title Intent",
            image: "DALL·E 2024-10-02 19.30.48 - A detailed image of a Premier League trophy with the Arsenal logo subtly engraved, surrounded by Arsenal fans cheering in the background, symbolizing .webp",
            url: "articles/arsenal-signs-viktor-gyokeres-record-transfer.html",
            date: "Sep 5, 2025"
        },
        {
            title: "Manchester City Face UEFA Investigation",
            image: "DALL·E 2024-10-09 18.37.35 - A courtroom setting where Manchester City's logo is displayed alongside Premier League's logo, representing a legal battle over financial rules. The s.webp",
            url: "articles/manchester-city-uefa-investigation-2025.html",
            date: "Sep 4, 2025"
        },
        {
            title: "Chelsea's £150m Double Deal for Osimhen and Kvaratskhelia",
            image: "DALL·E 2024-09-30 18.55.23 - An action-packed football scene featuring Cole Palmer in Chelsea's blue kit, dribbling the ball with agility and focus in a Premier League match. The .webp",
            url: "articles/chelsea-osimhen-kvaratskhelia-transfer-news.html",
            date: "Sep 3, 2025"
        },
        {
            title: "Tottenham Secure Champions League with Kane Return",
            image: "harry_kane.webp",
            url: "articles/harry-kane-tottenham-return-champions-league.html",
            date: "Sep 2, 2025"
        },
        {
            title: "Newcastle's Saudi Backing Transforms Premier League",
            image: "DALL·E 2024-09-24 18.41.18 - A stunning Premier League football stadium at sunset, with a beautifully designed modern structure. The stadium has sleek architecture and is packed w.webp",
            url: "articles/newcastle-saudi-backing-premier-league-impact.html",
            date: "Sep 1, 2025"
        }
    ];

    // Create the sidebar HTML
    function createReadNextSidebar() {
        const sidebarHTML = `
            <div class="read-next-sidebar">
                <div class="read-next-header">
                    <h3>You Should Read Next</h3>
                    <span class="read-next-icon">📚</span>
                </div>
                <div class="read-next-articles">
                    ${readNextArticles.map(article => `
                        <a href="${article.url}" class="read-next-item">
                            <div class="read-next-image">
                                <img src="${article.image}" alt="${article.title}" loading="lazy" onerror="this.src='placeholder.jpg'">
                            </div>
                            <div class="read-next-content">
                                <h4 class="read-next-title">${article.title}</h4>
                                <span class="read-next-date">${article.date}</span>
                            </div>
                        </a>
                    `).join('')}
                </div>
                <div class="read-next-footer">
                    <a href="all-news.html" class="read-next-more">
                        View All Articles
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </a>
                </div>
            </div>
        `;
        
        return sidebarHTML;
    }

    // Find the container to insert the sidebar
    const targetContainer = document.querySelector('.read-next-container');
    if (targetContainer) {
        targetContainer.innerHTML = createReadNextSidebar();
    }
});