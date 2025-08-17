// Comments System for EPL News Hub
(function() {
    'use strict';

    class CommentsSystem {
        constructor() {
            this.storageKey = 'epl-comments';
            this.comments = this.loadComments();
            this.currentUser = this.getCurrentUser();
            this.articleId = this.getArticleId();
            this.init();
        }

        getArticleId() {
            // Get article ID from URL or page title
            const path = window.location.pathname;
            if (path.includes('/articles/')) {
                return path.split('/articles/')[1].replace('.html', '');
            }
            // Fallback to page title
            return document.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        }

        getCurrentUser() {
            // Check if user is logged in
            const userLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
            const membershipLevel = localStorage.getItem('membershipLevel') || 'free';
            
            if (userLoggedIn) {
                // Try to get user info from localStorage
                const userName = localStorage.getItem('userName') || 'Anonymous User';
                return {
                    isLoggedIn: true,
                    name: userName,
                    membershipLevel: membershipLevel,
                    avatar: this.generateAvatar(userName)
                };
            }
            
            return {
                isLoggedIn: false,
                name: 'Guest',
                membershipLevel: 'free',
                avatar: this.generateAvatar('Guest')
            };
        }

        generateAvatar(name) {
            // Generate avatar based on name initials
            const initials = name.split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            
            // Generate color based on name
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const color = `hsl(${hash % 360}, 70%, 50%)`;
            
            return {
                initials: initials,
                color: color
            };
        }

        loadComments() {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (error) {
                    console.error('Error loading comments:', error);
                    return {};
                }
            }
            return {};
        }

        saveComments() {
            localStorage.setItem(this.storageKey, JSON.stringify(this.comments));
        }

        init() {
            // Only initialize on article pages
            if (!this.isArticlePage()) return;
            
            this.createCommentsSection();
            this.attachEventListeners();
            this.renderComments();
        }

        isArticlePage() {
            return window.location.pathname.includes('/articles/') || 
                   document.querySelector('.article-content, .nyt-article');
        }

        createCommentsSection() {
            // Find article content or main content area
            const articleContent = document.querySelector('.article-content, .nyt-article, main, .main-content');
            if (!articleContent) return;

            // Create comments container
            const commentsSection = document.createElement('div');
            commentsSection.className = 'comments-section';
            commentsSection.innerHTML = `
                <div class="comments-container">
                    <div class="comments-header">
                        <h2 class="comments-title">
                            <span class="comment-icon">💬</span>
                            Comments
                            <span class="comment-count" id="comment-count">(0)</span>
                        </h2>
                        <div class="comments-sort">
                            <select id="comment-sort">
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="popular">Most Popular</option>
                            </select>
                        </div>
                    </div>

                    <div class="comment-form-container" id="comment-form-container">
                        <div class="comment-avatar">
                            <div class="avatar-circle" id="user-avatar"></div>
                        </div>
                        <div class="comment-form">
                            <div class="form-header">
                                <span id="commenting-as"></span>
                            </div>
                            <textarea 
                                class="comment-input" 
                                id="comment-input" 
                                placeholder="Share your thoughts on this article..."
                                rows="3"
                            ></textarea>
                            <div class="comment-actions">
                                <div class="comment-guidelines">
                                    <small>Please be respectful and stay on topic.</small>
                                </div>
                                <div class="comment-buttons">
                                    <button class="btn-cancel" id="btn-cancel">Cancel</button>
                                    <button class="btn-submit" id="btn-submit">Post Comment</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="comments-list" id="comments-list">
                        <!-- Comments will be rendered here -->
                    </div>

                    <div class="load-more-container" id="load-more-container" style="display: none;">
                        <button class="btn-load-more" id="btn-load-more">Load More Comments</button>
                    </div>
                </div>
            `;

            // Add styles
            this.injectStyles();

            // Insert after article content
            articleContent.parentNode.insertBefore(commentsSection, articleContent.nextSibling);

            // Update user info in form
            this.updateCommentForm();
        }

        updateCommentForm() {
            const avatar = document.getElementById('user-avatar');
            const commentingAs = document.getElementById('commenting-as');
            const commentInput = document.getElementById('comment-input');
            
            if (this.currentUser.isLoggedIn) {
                const userAvatar = this.currentUser.avatar;
                avatar.style.background = userAvatar.color;
                avatar.textContent = userAvatar.initials;
                
                commentingAs.textContent = `Commenting as ${this.currentUser.name}`;
                
                // Add membership badge
                if (this.currentUser.membershipLevel === 'pro') {
                    commentingAs.innerHTML += ' <span class="badge-pro">PRO</span>';
                } else if (this.currentUser.membershipLevel === 'starter') {
                    commentingAs.innerHTML += ' <span class="badge-starter">STARTER</span>';
                }
            } else {
                avatar.style.background = '#ccc';
                avatar.textContent = '?';
                commentingAs.innerHTML = 'Commenting as Guest | <a href="/signin.html" style="color: #0066cc;">Sign in</a> for better features';
                commentInput.placeholder = 'Sign in to join the discussion with your name...';
            }
        }

        attachEventListeners() {
            // Submit comment
            const submitBtn = document.getElementById('btn-submit');
            const cancelBtn = document.getElementById('btn-cancel');
            const commentInput = document.getElementById('comment-input');
            const sortSelect = document.getElementById('comment-sort');

            if (submitBtn) {
                submitBtn.addEventListener('click', () => this.submitComment());
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    commentInput.value = '';
                });
            }

            if (commentInput) {
                // Auto-resize textarea
                commentInput.addEventListener('input', (e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                });

                // Submit on Ctrl+Enter
                commentInput.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.key === 'Enter') {
                        this.submitComment();
                    }
                });
            }

            if (sortSelect) {
                sortSelect.addEventListener('change', (e) => {
                    this.renderComments(e.target.value);
                });
            }
        }

        submitComment() {
            const commentInput = document.getElementById('comment-input');
            const content = commentInput.value.trim();
            
            if (!content) {
                this.showNotification('Please write a comment before posting', 'error');
                return;
            }

            // Create comment object
            const comment = {
                id: Date.now().toString(),
                articleId: this.articleId,
                author: this.currentUser.name,
                authorAvatar: this.currentUser.avatar,
                membershipLevel: this.currentUser.membershipLevel,
                content: content,
                timestamp: Date.now(),
                likes: 0,
                replies: [],
                edited: false
            };

            // Add comment to storage
            if (!this.comments[this.articleId]) {
                this.comments[this.articleId] = [];
            }
            this.comments[this.articleId].unshift(comment);
            this.saveComments();

            // Clear input
            commentInput.value = '';
            commentInput.style.height = 'auto';

            // Re-render comments
            this.renderComments();

            // Show success message
            this.showNotification('Comment posted successfully!', 'success');
        }

        renderComments(sortBy = 'newest') {
            const commentsList = document.getElementById('comments-list');
            const commentCount = document.getElementById('comment-count');
            
            if (!commentsList) return;

            // Get comments for this article
            const articleComments = this.comments[this.articleId] || [];
            
            // Update count
            if (commentCount) {
                commentCount.textContent = `(${articleComments.length})`;
            }

            // Sort comments
            const sortedComments = this.sortComments(articleComments, sortBy);

            // Clear existing comments
            commentsList.innerHTML = '';

            if (sortedComments.length === 0) {
                commentsList.innerHTML = `
                    <div class="no-comments">
                        <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                `;
                return;
            }

            // Render each comment
            sortedComments.forEach(comment => {
                const commentElement = this.createCommentElement(comment);
                commentsList.appendChild(commentElement);
            });
        }

        sortComments(comments, sortBy) {
            const sorted = [...comments];
            
            switch (sortBy) {
                case 'oldest':
                    return sorted.sort((a, b) => a.timestamp - b.timestamp);
                case 'popular':
                    return sorted.sort((a, b) => b.likes - a.likes);
                case 'newest':
                default:
                    return sorted.sort((a, b) => b.timestamp - a.timestamp);
            }
        }

        createCommentElement(comment) {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.dataset.commentId = comment.id;

            const timeAgo = this.getTimeAgo(comment.timestamp);
            const memberBadge = this.getMemberBadge(comment.membershipLevel);

            div.innerHTML = `
                <div class="comment-avatar">
                    <div class="avatar-circle" style="background: ${comment.authorAvatar.color}">
                        ${comment.authorAvatar.initials}
                    </div>
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        ${memberBadge}
                        <span class="comment-time">${timeAgo}</span>
                        ${comment.edited ? '<span class="comment-edited">(edited)</span>' : ''}
                    </div>
                    <div class="comment-text">${this.escapeHtml(comment.content)}</div>
                    <div class="comment-footer">
                        <button class="comment-action btn-like" data-id="${comment.id}">
                            <span class="like-icon">👍</span>
                            <span class="like-count">${comment.likes || 0}</span>
                        </button>
                        <button class="comment-action btn-reply" data-id="${comment.id}">
                            Reply
                        </button>
                        ${this.canModerate(comment) ? `
                            <button class="comment-action btn-edit" data-id="${comment.id}">
                                Edit
                            </button>
                            <button class="comment-action btn-delete" data-id="${comment.id}">
                                Delete
                            </button>
                        ` : ''}
                    </div>
                    ${comment.replies && comment.replies.length > 0 ? `
                        <div class="comment-replies">
                            ${comment.replies.map(reply => this.createReplyElement(reply)).join('')}
                        </div>
                    ` : ''}
                </div>
            `;

            // Attach action listeners
            this.attachCommentActions(div, comment);

            return div;
        }

        createReplyElement(reply) {
            const timeAgo = this.getTimeAgo(reply.timestamp);
            const memberBadge = this.getMemberBadge(reply.membershipLevel);

            return `
                <div class="reply-item">
                    <div class="reply-avatar">
                        <div class="avatar-circle small" style="background: ${reply.authorAvatar.color}">
                            ${reply.authorAvatar.initials}
                        </div>
                    </div>
                    <div class="reply-content">
                        <div class="reply-header">
                            <span class="reply-author">${reply.author}</span>
                            ${memberBadge}
                            <span class="reply-time">${timeAgo}</span>
                        </div>
                        <div class="reply-text">${this.escapeHtml(reply.content)}</div>
                    </div>
                </div>
            `;
        }

        attachCommentActions(element, comment) {
            // Like button
            const likeBtn = element.querySelector('.btn-like');
            if (likeBtn) {
                likeBtn.addEventListener('click', () => this.likeComment(comment.id));
            }

            // Reply button
            const replyBtn = element.querySelector('.btn-reply');
            if (replyBtn) {
                replyBtn.addEventListener('click', () => this.showReplyForm(comment.id));
            }

            // Edit button
            const editBtn = element.querySelector('.btn-edit');
            if (editBtn) {
                editBtn.addEventListener('click', () => this.editComment(comment.id));
            }

            // Delete button
            const deleteBtn = element.querySelector('.btn-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteComment(comment.id));
            }
        }

        likeComment(commentId) {
            const articleComments = this.comments[this.articleId] || [];
            const comment = articleComments.find(c => c.id === commentId);
            
            if (comment) {
                // Check if user already liked (simple implementation)
                const likedKey = `liked-${commentId}`;
                const alreadyLiked = localStorage.getItem(likedKey) === 'true';
                
                if (alreadyLiked) {
                    comment.likes--;
                    localStorage.removeItem(likedKey);
                } else {
                    comment.likes++;
                    localStorage.setItem(likedKey, 'true');
                }
                
                this.saveComments();
                this.renderComments();
            }
        }

        showReplyForm(commentId) {
            // Implementation for reply form
            this.showNotification('Reply feature coming soon!', 'info');
        }

        editComment(commentId) {
            // Implementation for edit
            this.showNotification('Edit feature coming soon!', 'info');
        }

        deleteComment(commentId) {
            if (confirm('Are you sure you want to delete this comment?')) {
                const articleComments = this.comments[this.articleId] || [];
                const index = articleComments.findIndex(c => c.id === commentId);
                
                if (index !== -1) {
                    articleComments.splice(index, 1);
                    this.saveComments();
                    this.renderComments();
                    this.showNotification('Comment deleted', 'success');
                }
            }
        }

        canModerate(comment) {
            // User can moderate their own comments
            return comment.author === this.currentUser.name;
        }

        getMemberBadge(level) {
            switch (level) {
                case 'pro':
                    return '<span class="badge-pro">PRO</span>';
                case 'starter':
                    return '<span class="badge-starter">STARTER</span>';
                default:
                    return '';
            }
        }

        getTimeAgo(timestamp) {
            const seconds = Math.floor((Date.now() - timestamp) / 1000);
            
            if (seconds < 60) return 'just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
            if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
            
            return new Date(timestamp).toLocaleDateString();
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML.replace(/\n/g, '<br>');
        }

        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `comment-notification ${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .comments-section {
                    margin: 60px auto;
                    max-width: 800px;
                    padding: 0 20px;
                }

                .comments-container {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    border: 1px solid #e0e0e0;
                }

                .comments-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #f0f0f0;
                }

                .comments-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #1a1a1a;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .comment-icon {
                    font-size: 1.5rem;
                }

                .comment-count {
                    font-size: 1rem;
                    color: #666;
                    font-weight: 400;
                    margin-left: 10px;
                }

                .comments-sort select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: white;
                    font-size: 14px;
                    cursor: pointer;
                }

                .comment-form-container {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .comment-avatar, .avatar-circle {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 16px;
                    flex-shrink: 0;
                }

                .avatar-circle.small {
                    width: 32px;
                    height: 32px;
                    font-size: 12px;
                }

                .comment-form {
                    flex: 1;
                }

                .form-header {
                    margin-bottom: 10px;
                    font-size: 14px;
                    color: #666;
                }

                .comment-input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 15px;
                    resize: vertical;
                    min-height: 80px;
                    font-family: inherit;
                    transition: border-color 0.3s;
                }

                .comment-input:focus {
                    outline: none;
                    border-color: #0066cc;
                    box-shadow: 0 0 0 3px rgba(0,102,204,0.1);
                }

                .comment-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 12px;
                }

                .comment-guidelines {
                    color: #888;
                    font-size: 13px;
                }

                .comment-buttons {
                    display: flex;
                    gap: 10px;
                }

                .btn-cancel, .btn-submit {
                    padding: 8px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .btn-cancel {
                    background: transparent;
                    color: #666;
                }

                .btn-cancel:hover {
                    background: #e0e0e0;
                }

                .btn-submit {
                    background: #0066cc;
                    color: white;
                }

                .btn-submit:hover {
                    background: #0052a3;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0,102,204,0.3);
                }

                .comments-list {
                    margin-top: 20px;
                }

                .comment-item {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 25px;
                    padding-bottom: 25px;
                    border-bottom: 1px solid #f0f0f0;
                }

                .comment-item:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }

                .comment-content {
                    flex: 1;
                }

                .comment-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                    border: none;
                    padding: 0;
                }

                .comment-author {
                    font-weight: 600;
                    color: #1a1a1a;
                    font-size: 15px;
                }

                .comment-time {
                    color: #888;
                    font-size: 13px;
                }

                .comment-edited {
                    color: #888;
                    font-size: 13px;
                    font-style: italic;
                }

                .comment-text {
                    color: #333;
                    line-height: 1.6;
                    font-size: 15px;
                    margin-bottom: 12px;
                }

                .comment-footer {
                    display: flex;
                    gap: 15px;
                }

                .comment-action {
                    background: transparent;
                    border: none;
                    color: #666;
                    font-size: 13px;
                    cursor: pointer;
                    padding: 5px 10px;
                    border-radius: 4px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .comment-action:hover {
                    background: #f0f0f0;
                    color: #0066cc;
                }

                .btn-like.liked {
                    color: #0066cc;
                    background: #e6f2ff;
                }

                .comment-replies {
                    margin-top: 20px;
                    margin-left: 40px;
                    padding-left: 20px;
                    border-left: 2px solid #f0f0f0;
                }

                .reply-item {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 15px;
                }

                .reply-content {
                    flex: 1;
                }

                .reply-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                }

                .reply-author {
                    font-weight: 600;
                    font-size: 14px;
                }

                .reply-time {
                    color: #888;
                    font-size: 12px;
                }

                .reply-text {
                    color: #333;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .badge-pro, .badge-starter {
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .badge-pro {
                    background: linear-gradient(135deg, #6f42c1, #20c997);
                    color: white;
                }

                .badge-starter {
                    background: #f39c12;
                    color: white;
                }

                .no-comments {
                    text-align: center;
                    padding: 40px;
                    color: #888;
                }

                .comment-notification {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 10000;
                    transform: translateY(100px);
                    opacity: 0;
                    transition: all 0.3s;
                }

                .comment-notification.show {
                    transform: translateY(0);
                    opacity: 1;
                }

                .comment-notification.success {
                    background: #28a745;
                }

                .comment-notification.error {
                    background: #dc3545;
                }

                .comment-notification.info {
                    background: #17a2b8;
                }

                .btn-load-more {
                    width: 100%;
                    padding: 12px;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    color: #495057;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .btn-load-more:hover {
                    background: #e9ecef;
                    transform: translateY(-1px);
                }

                @media (max-width: 768px) {
                    .comments-container {
                        padding: 20px;
                    }

                    .comments-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 15px;
                    }

                    .comment-form-container {
                        padding: 15px;
                    }

                    .comment-replies {
                        margin-left: 20px;
                        padding-left: 15px;
                    }

                    .comment-notification {
                        left: 20px;
                        right: 20px;
                        bottom: 20px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.commentsSystem = new CommentsSystem();
        });
    } else {
        window.commentsSystem = new CommentsSystem();
    }
})();