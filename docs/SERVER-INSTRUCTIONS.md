# EPL News Hub - Newsletter Server Setup

## Quick Start

1. **Start the Server**
   - Double-click `start-server.bat` OR
   - Open Command Prompt in this folder and run: `npm start`

2. **Access Your Website**
   - Main website: http://localhost:3000
   - Admin panel: http://localhost:3000/admin.html

3. **Admin Panel Features**
   - View all newsletter subscribers
   - Export subscriber list to CSV
   - See subscription statistics (daily, weekly, monthly)
   - Clear all data if needed

## Server Information

- **Port**: 3000
- **Subscriber Data**: Stored in `subscriptions.json`
- **User Data**: Stored in `users.json`

## Important Notes

- The server must be running for the newsletter signup to work
- Admin panel is only accessible when server is running
- All data is stored locally in JSON files
- Keep the Command Prompt window open while using the website

## Newsletter Functionality

✅ **Working Features:**
- Newsletter signup form at top of homepage
- Form validation (name and email required)
- Data storage in `subscriptions.json`
- Admin panel to view all subscribers
- CSV export functionality
- Mobile responsive design

## Troubleshooting

**If newsletter signup shows error:**
1. Make sure server is running (`start-server.bat`)
2. Check that port 3000 is not blocked
3. Access site via http://localhost:3000 (not file:// URLs)

**If admin panel won't load:**
1. Ensure server is running
2. Go to http://localhost:3000/admin.html
3. Check browser console for errors

## Privacy & Security

- This is a local development server
- Only accessible from your computer
- No external access unless configured
- All subscriber data stays on your machine