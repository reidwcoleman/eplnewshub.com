// Comments Server for EPL News Hub
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const COMMENTS_FILE = path.join(__dirname, 'comments-data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize comments file if it doesn't exist
async function initializeCommentsFile() {
    try {
        await fs.access(COMMENTS_FILE);
    } catch {
        await fs.writeFile(COMMENTS_FILE, JSON.stringify({}), 'utf8');
        console.log('Created new comments data file');
    }
}

// Load comments from file
async function loadComments() {
    try {
        const data = await fs.readFile(COMMENTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading comments:', error);
        return {};
    }
}

// Save comments to file
async function saveComments(comments) {
    try {
        await fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving comments:', error);
        return false;
    }
}

// Get comments for a specific article
app.get('/api/comments/:articleId', async (req, res) => {
    try {
        const { articleId } = req.params;
        const comments = await loadComments();
        const articleComments = comments[articleId] || [];
        
        res.json({
            success: true,
            comments: articleComments
        });
    } catch (error) {
        console.error('Error getting comments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load comments'
        });
    }
});

// Post a new comment
app.post('/api/comments/:articleId', async (req, res) => {
    try {
        const { articleId } = req.params;
        const comment = req.body;
        
        // Validate comment
        if (!comment.content || !comment.author) {
            return res.status(400).json({
                success: false,
                error: 'Comment must have content and author'
            });
        }
        
        // Add server-side timestamp and ID
        comment.id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
        comment.timestamp = Date.now();
        comment.articleId = articleId;
        comment.likes = comment.likes || 0;
        comment.replies = comment.replies || [];
        
        // Load existing comments
        const comments = await loadComments();
        
        // Initialize article comments if needed
        if (!comments[articleId]) {
            comments[articleId] = [];
        }
        
        // Add new comment
        comments[articleId].unshift(comment);
        
        // Save comments
        const saved = await saveComments(comments);
        
        if (saved) {
            res.json({
                success: true,
                comment: comment
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to save comment'
            });
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to post comment'
        });
    }
});

// Like/unlike a comment
app.post('/api/comments/:articleId/:commentId/like', async (req, res) => {
    try {
        const { articleId, commentId } = req.params;
        const { userId, action } = req.body; // action: 'like' or 'unlike'
        
        const comments = await loadComments();
        const articleComments = comments[articleId] || [];
        
        const comment = articleComments.find(c => c.id === commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                error: 'Comment not found'
            });
        }
        
        // Initialize likes tracking
        if (!comment.likedBy) {
            comment.likedBy = [];
        }
        
        if (action === 'like') {
            if (!comment.likedBy.includes(userId)) {
                comment.likedBy.push(userId);
                comment.likes = comment.likedBy.length;
            }
        } else if (action === 'unlike') {
            comment.likedBy = comment.likedBy.filter(id => id !== userId);
            comment.likes = comment.likedBy.length;
        }
        
        await saveComments(comments);
        
        res.json({
            success: true,
            likes: comment.likes
        });
    } catch (error) {
        console.error('Error updating like:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update like'
        });
    }
});

// Delete a comment
app.delete('/api/comments/:articleId/:commentId', async (req, res) => {
    try {
        const { articleId, commentId } = req.params;
        const { author } = req.body;
        
        const comments = await loadComments();
        const articleComments = comments[articleId] || [];
        
        const commentIndex = articleComments.findIndex(c => c.id === commentId);
        if (commentIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Comment not found'
            });
        }
        
        // Check if user can delete (must be author)
        if (articleComments[commentIndex].author !== author) {
            return res.status(403).json({
                success: false,
                error: 'You can only delete your own comments'
            });
        }
        
        // Remove comment
        articleComments.splice(commentIndex, 1);
        comments[articleId] = articleComments;
        
        await saveComments(comments);
        
        res.json({
            success: true,
            message: 'Comment deleted'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete comment'
        });
    }
});

// Edit a comment
app.put('/api/comments/:articleId/:commentId', async (req, res) => {
    try {
        const { articleId, commentId } = req.params;
        const { content, author } = req.body;
        
        const comments = await loadComments();
        const articleComments = comments[articleId] || [];
        
        const comment = articleComments.find(c => c.id === commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                error: 'Comment not found'
            });
        }
        
        // Check if user can edit (must be author)
        if (comment.author !== author) {
            return res.status(403).json({
                success: false,
                error: 'You can only edit your own comments'
            });
        }
        
        // Update comment
        comment.content = content;
        comment.edited = true;
        comment.editedAt = Date.now();
        
        await saveComments(comments);
        
        res.json({
            success: true,
            comment: comment
        });
    } catch (error) {
        console.error('Error editing comment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to edit comment'
        });
    }
});

// Reply to a comment
app.post('/api/comments/:articleId/:commentId/reply', async (req, res) => {
    try {
        const { articleId, commentId } = req.params;
        const reply = req.body;
        
        // Validate reply
        if (!reply.content || !reply.author) {
            return res.status(400).json({
                success: false,
                error: 'Reply must have content and author'
            });
        }
        
        // Add reply metadata
        reply.id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
        reply.timestamp = Date.now();
        
        const comments = await loadComments();
        const articleComments = comments[articleId] || [];
        
        const comment = articleComments.find(c => c.id === commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                error: 'Comment not found'
            });
        }
        
        // Initialize replies if needed
        if (!comment.replies) {
            comment.replies = [];
        }
        
        // Add reply
        comment.replies.push(reply);
        
        await saveComments(comments);
        
        res.json({
            success: true,
            reply: reply
        });
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add reply'
        });
    }
});

// Get all comments (admin endpoint)
app.get('/api/comments', async (req, res) => {
    try {
        const comments = await loadComments();
        res.json({
            success: true,
            comments: comments
        });
    } catch (error) {
        console.error('Error getting all comments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load comments'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Comments server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, async () => {
    await initializeCommentsFile();
    console.log(`Comments server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/comments`);
});