// Comments System using JSONBin.io (Free JSON Storage Service)
(function() {
    'use strict';

    // JSONBin.io Configuration
    // You need to sign up at https://jsonbin.io and get your API key
    const JSONBIN_API_KEY = '$2a$10$YOUR_API_KEY_HERE'; // Replace with your API key
    const JSONBIN_BIN_ID = 'YOUR_BIN_ID_HERE'; // Replace with your bin ID
    const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';

    class CommentsSystem {
        constructor() {
            this.currentUser = this.getCurrentUser();
            this.comments = {};
            this.articleId = this.getArticleId();
            this.init();
        }

        getArticleId() {
            const path = window.location.pathname;
            const match = path.match(/articles\/(.+)\.html/);
            return match ? match[1] : 'homepage';
        }

        getCurrentUser() {
            const savedUser = localStorage.getItem('commentsUser');
            if (savedUser) {
                return JSON.parse(savedUser);
            }
            
            const authData = localStorage.getItem('authData');
            if (authData) {
                const auth = JSON.parse(authData);
                return {
                    name: auth.email ? auth.email.split('@')[0] : 'User',
                    email: auth.email,
                    isPro: auth.membershipLevel === 'pro',
                    isStarter: auth.membershipLevel === 'starter',
                    avatar: this.generateAvatar(auth.email || 'User')
                };
            }
            
            return null;
        }

        generateAvatar(name) {
            const initials = name.split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
            return initials || 'AN';
        }

        async init() {
            this.createStyles();
            this.createCommentSection();
            await this.loadComments();
            this.attachEventListeners();
            
            // Auto-refresh comments every 30 seconds
            setInterval(() => this.loadComments(), 30000);
        }

        createStyles() {
            if (document.getElementById('comments-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'comments-styles';
            styles.textContent = `
                .comments-section {
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                }
                
                .comments-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 2px solid #e5e7eb;
                }
                
                .comments-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1f2937;
                }
                
                .comments-count {
                    background: #f3f4f6;
                    color: #6b7280;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    font-weight: 500;
                }
                
                .comment-form {
                    background: #f9fafb;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 32px;
                    border: 1px solid #e5e7eb;
                }
                
                .comment-form-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 16px;
                    gap: 12px;
                }
                
                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 0.875rem;
                }
                
                .user-info {
                    flex: 1;
                }
                
                .user-name {
                    font-weight: 600;
                    color: #1f2937;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .member-badge {
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .badge-pro {
                    background: linear-gradient(135deg, #ffd700, #ffed4e);
                    color: #7c2d12;
                }
                
                .badge-starter {
                    background: linear-gradient(135deg, #10b981, #34d399);
                    color: white;
                }
                
                .comment-input-wrapper {
                    position: relative;
                }
                
                .comment-textarea {
                    width: 100%;
                    min-height: 100px;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 1rem;
                    resize: vertical;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                
                .comment-textarea:focus {
                    outline: none;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }
                
                .comment-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 12px;
                }
                
                .comment-guidelines {
                    font-size: 0.875rem;
                    color: #6b7280;
                }
                
                .submit-comment-btn {
                    background: #37003c;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .submit-comment-btn:hover {
                    background: #5b0063;
                }
                
                .submit-comment-btn:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                }
                
                .guest-prompt {
                    background: #fef3c7;
                    border: 1px solid #fbbf24;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 16px;
                }
                
                .guest-prompt p {
                    margin: 0 0 12px 0;
                    color: #92400e;
                }
                
                .guest-name-input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #fbbf24;
                    border-radius: 6px;
                    font-size: 0.875rem;
                }
                
                .comments-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .comment-card {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 20px;
                    transition: box-shadow 0.2s;
                }
                
                .comment-card:hover {
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                .comment-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                
                .comment-meta {
                    flex: 1;
                }
                
                .comment-author {
                    font-weight: 600;
                    color: #1f2937;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                }
                
                .comment-time {
                    font-size: 0.875rem;
                    color: #6b7280;
                }
                
                .comment-content {
                    color: #374151;
                    line-height: 1.6;
                    margin-bottom: 12px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                
                .comment-footer {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }
                
                .comment-action {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.875rem;
                    color: #6b7280;
                }
                
                .comment-action:hover {
                    background: #f3f4f6;
                    border-color: #d1d5db;
                }
                
                .comment-action.liked {
                    background: #fef2f2;
                    border-color: #ef4444;
                    color: #ef4444;
                }
                
                .empty-comments {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6b7280;
                }
                
                .empty-comments-icon {
                    font-size: 3rem;
                    margin-bottom: 16px;
                }
                
                .empty-comments-text {
                    font-size: 1.125rem;
                    margin-bottom: 8px;
                    color: #4b5563;
                }
                
                .empty-comments-subtext {
                    font-size: 0.875rem;
                }
                
                .sort-controls {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    font-size: 0.875rem;
                }
                
                .sort-select {
                    padding: 4px 8px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    background: white;
                    cursor: pointer;
                }
                
                @media (max-width: 640px) {
                    .comments-section {
                        padding: 16px;
                    }
                    
                    .comments-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }
                    
                    .comment-form {
                        padding: 16px;
                    }
                    
                    .comment-actions {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                    }
                    
                    .submit-comment-btn {
                        width: 100%;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        createCommentSection() {
            const existingSection = document.getElementById('comments-section');
            if (existingSection) existingSection.remove();
            
            const section = document.createElement('div');
            section.id = 'comments-section';
            section.className = 'comments-section';
            section.innerHTML = `
                <div class="comments-header">
                    <h2 class="comments-title">Comments</h2>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="sort-controls">
                            <label for="sort-select">Sort by:</label>
                            <select id="sort-select" class="sort-select">
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="popular">Most Popular</option>
                            </select>
                        </div>
                        <span class="comments-count">0 comments</span>
                    </div>
                </div>
                
                <div class="comment-form">
                    ${this.currentUser ? `
                        <div class="comment-form-header">
                            <div class="user-avatar">${this.currentUser.avatar}</div>
                            <div class="user-info">
                                <div class="user-name">
                                    ${this.currentUser.name}
                                    ${this.currentUser.isPro ? '<span class="member-badge badge-pro">PRO</span>' : ''}
                                    ${this.currentUser.isStarter ? '<span class="member-badge badge-starter">STARTER</span>' : ''}
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="guest-prompt">
                            <p>💬 Comment as a guest or <a href="/signin.html" style="color: #37003c; font-weight: 600;">sign in</a> for member benefits</p>
                            <input type="text" class="guest-name-input" placeholder="Enter your name (required)" id="guest-name">
                        </div>
                    `}
                    <div class="comment-input-wrapper">
                        <textarea 
                            class="comment-textarea" 
                            placeholder="Share your thoughts on this article..."
                            id="comment-input"
                        ></textarea>
                    </div>
                    <div class="comment-actions">
                        <span class="comment-guidelines">Please be respectful and constructive</span>
                        <button class="submit-comment-btn" id="submit-comment">Post Comment</button>
                    </div>
                </div>
                
                <div id="comments-list" class="comments-list">
                    <div class="empty-comments">
                        <div class="empty-comments-icon">💭</div>
                        <div class="empty-comments-text">No comments yet</div>
                        <div class="empty-comments-subtext">Be the first to share your thoughts!</div>
                    </div>
                </div>
            `;
            
            // Find the best place to insert comments
            const article = document.querySelector('article') || document.querySelector('.modern-article') || document.querySelector('main');
            if (article) {
                article.appendChild(section);
            } else {
                document.body.appendChild(section);
            }
        }

        async loadComments() {
            try {
                const response = await fetch(`${JSONBIN_BASE_URL}/b/${JSONBIN_BIN_ID}/latest`, {
                    headers: {
                        'X-Master-Key': JSONBIN_API_KEY
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.comments = data.record || {};
                    this.displayComments();
                }
            } catch (error) {
                console.error('Failed to load comments:', error);
                // Fall back to local storage
                this.loadLocalComments();
            }
        }

        loadLocalComments() {
            const stored = localStorage.getItem(`comments_${this.articleId}`);
            this.comments[this.articleId] = stored ? JSON.parse(stored) : [];
            this.displayComments();
        }

        async saveComments() {
            try {
                await fetch(`${JSONBIN_BASE_URL}/b/${JSONBIN_BIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_API_KEY
                    },
                    body: JSON.stringify(this.comments)
                });
            } catch (error) {
                console.error('Failed to save comments:', error);
                // Fall back to local storage
                this.saveLocalComments();
            }
        }

        saveLocalComments() {
            localStorage.setItem(`comments_${this.articleId}`, JSON.stringify(this.comments[this.articleId] || []));
        }

        displayComments() {
            const articleComments = this.comments[this.articleId] || [];
            const sortedComments = this.sortComments(articleComments);
            const listElement = document.getElementById('comments-list');
            const countElement = document.querySelector('.comments-count');
            
            countElement.textContent = `${articleComments.length} comment${articleComments.length !== 1 ? 's' : ''}`;
            
            if (sortedComments.length === 0) {
                listElement.innerHTML = `
                    <div class="empty-comments">
                        <div class="empty-comments-icon">💭</div>
                        <div class="empty-comments-text">No comments yet</div>
                        <div class="empty-comments-subtext">Be the first to share your thoughts!</div>
                    </div>
                `;
                return;
            }
            
            listElement.innerHTML = sortedComments.map(comment => this.renderComment(comment)).join('');
        }

        sortComments(comments) {
            const sortBy = document.getElementById('sort-select')?.value || 'newest';
            const sorted = [...comments];
            
            switch(sortBy) {
                case 'oldest':
                    return sorted.sort((a, b) => a.timestamp - b.timestamp);
                case 'popular':
                    return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                case 'newest':
                default:
                    return sorted.sort((a, b) => b.timestamp - a.timestamp);
            }
        }

        renderComment(comment) {
            const timeAgo = this.getTimeAgo(comment.timestamp);
            const isLiked = this.isCommentLiked(comment.id);
            
            return `
                <div class="comment-card" data-comment-id="${comment.id}">
                    <div class="comment-header">
                        <div class="user-avatar">${comment.avatar}</div>
                        <div class="comment-meta">
                            <div class="comment-author">
                                ${comment.author}
                                ${comment.isPro ? '<span class="member-badge badge-pro">PRO</span>' : ''}
                                ${comment.isStarter ? '<span class="member-badge badge-starter">STARTER</span>' : ''}
                            </div>
                            <div class="comment-time">${timeAgo}</div>
                        </div>
                    </div>
                    <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                    <div class="comment-footer">
                        <button class="comment-action like-btn ${isLiked ? 'liked' : ''}" data-comment-id="${comment.id}">
                            <span>${isLiked ? '❤️' : '🤍'}</span>
                            <span>${comment.likes || 0}</span>
                        </button>
                    </div>
                </div>
            `;
        }

        isCommentLiked(commentId) {
            const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
            return likedComments.includes(commentId);
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        getTimeAgo(timestamp) {
            const seconds = Math.floor((Date.now() - timestamp) / 1000);
            
            if (seconds < 60) return 'just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) !== 1 ? 's' : ''} ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) !== 1 ? 's' : ''} ago`;
            if (seconds < 2592000) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) !== 1 ? 's' : ''} ago`;
            return new Date(timestamp).toLocaleDateString();
        }

        attachEventListeners() {
            // Submit comment
            document.getElementById('submit-comment')?.addEventListener('click', () => this.submitComment());
            document.getElementById('comment-input')?.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    this.submitComment();
                }
            });
            
            // Sort comments
            document.getElementById('sort-select')?.addEventListener('change', () => this.displayComments());
            
            // Like comments
            document.addEventListener('click', (e) => {
                if (e.target.closest('.like-btn')) {
                    const commentId = e.target.closest('.like-btn').dataset.commentId;
                    this.toggleLike(commentId);
                }
            });
        }

        async submitComment() {
            const input = document.getElementById('comment-input');
            const content = input?.value.trim();
            
            if (!content) {
                alert('Please write a comment before posting');
                return;
            }
            
            let author = this.currentUser?.name;
            if (!author) {
                const guestName = document.getElementById('guest-name')?.value.trim();
                if (!guestName) {
                    alert('Please enter your name to comment as a guest');
                    return;
                }
                author = guestName;
            }
            
            const comment = {
                id: Date.now().toString(),
                author: author,
                avatar: this.currentUser?.avatar || this.generateAvatar(author),
                content: content,
                timestamp: Date.now(),
                likes: 0,
                isPro: this.currentUser?.isPro || false,
                isStarter: this.currentUser?.isStarter || false
            };
            
            if (!this.comments[this.articleId]) {
                this.comments[this.articleId] = [];
            }
            
            this.comments[this.articleId].push(comment);
            await this.saveComments();
            this.displayComments();
            
            // Clear input
            if (input) input.value = '';
            
            // Show success feedback
            const btn = document.getElementById('submit-comment');
            if (btn) {
                btn.textContent = '✓ Posted';
                btn.disabled = true;
                setTimeout(() => {
                    btn.textContent = 'Post Comment';
                    btn.disabled = false;
                }, 2000);
            }
        }

        async toggleLike(commentId) {
            const articleComments = this.comments[this.articleId] || [];
            const comment = articleComments.find(c => c.id === commentId);
            if (!comment) return;
            
            const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
            const isLiked = likedComments.includes(commentId);
            
            if (isLiked) {
                comment.likes = (comment.likes || 1) - 1;
                const index = likedComments.indexOf(commentId);
                likedComments.splice(index, 1);
            } else {
                comment.likes = (comment.likes || 0) + 1;
                likedComments.push(commentId);
            }
            
            localStorage.setItem('likedComments', JSON.stringify(likedComments));
            await this.saveComments();
            this.displayComments();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new CommentsSystem());
    } else {
        new CommentsSystem();
    }
})();