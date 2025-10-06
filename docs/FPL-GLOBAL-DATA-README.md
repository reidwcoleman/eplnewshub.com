# FPL AI Assistant - Global Data Storage System

## Overview

The FPL AI Assistant now features a **global persistent data storage system** that allows all users to contribute and benefit from shared FPL information. When someone feeds data to the AI, it becomes permanently available for everyone who visits the site.

## How It Works

### 1. Data Feeding
- Users can click "📝 Feed Data" to enter information feed mode
- Any information fed (player stats, injuries, form, etc.) is stored globally
- Examples:
  - "Haaland scored 2 goals and got 12 points"
  - "Palmer is now on penalties for Chelsea"
  - "Salah is injured and out for 2 weeks"

### 2. Global Storage
- Data is stored in multiple layers:
  - **Server-side**: `fpl-persistent-data.json` (when server running)
  - **Client-side backup**: localStorage for offline access
  - **Real-time sync**: Automatic synchronization across users

### 3. AI Integration
- When answering questions, AI checks global data first
- Community-fed information takes precedence over default responses
- All responses clearly indicate when using "🌐 Community data"

## File Structure

```
├── fpl-ai-assistant.html          # Main AI interface
├── fpl-ai-assistant-intelligent.js # Smart AI response system
├── fpl-data-manager.js            # Global data management
├── fpl-persistent-data.json       # Server-side data storage
├── data-server.js                 # Node.js persistence server
└── start-fpl-system.js           # System startup script
```

## Quick Start

### For Development
1. Start the data server:
   ```bash
   node start-fpl-system.js
   ```
   
2. Open `fpl-ai-assistant.html` in a web browser

3. Test feeding data:
   - Click "📝 Feed Data"
   - Enter: "Haaland scored 2 goals vs Brighton"
   - Switch back to chat mode
   - Ask: "Should I captain Haaland?"
   - AI will use your fed data in the response

### For Production
- Deploy `data-server.js` to your hosting platform
- Update API endpoints in `fpl-data-manager.js` if needed
- Static files can be served from any web server

## Key Features

### 🌐 Global Persistence
- All fed data is stored permanently and shared across users
- Data survives browser refreshes and new user visits
- Community builds a shared knowledge base over time

### 📊 Smart Data Management
- Automatic deduplication of similar information
- Timestamp-based data prioritization
- Player-specific information organization

### 🔄 Real-time Sync
- Data updates immediately across all active users
- Automatic fallback to cached data if server unavailable
- Visual feedback when data is saved globally

### 🛡️ Data Integrity
- Input validation and sanitization
- Merge conflicts resolved by timestamp
- Backup and export capabilities

## API Endpoints

When server is running:

- `GET /api/data` - Retrieve all global data
- `POST /api/data` - Save new data (merges with existing)

## Data Structure

```javascript
{
  "players": {
    "haaland": {
      "name": "Haaland",
      "info": [
        {
          "text": "Scored 2 goals vs Brighton", 
          "data": {"points": 12, "goals": 2},
          "timestamp": "2025-01-31T02:00:00.000Z"
        }
      ],
      "stats": {"lastPoints": 12, "lastGoals": 2},
      "created": "2025-01-31T02:00:00.000Z",
      "lastUpdated": "2025-01-31T02:00:00.000Z"
    }
  },
  "general": [
    {
      "text": "Newcastle have easy fixtures for next 5 GWs",
      "timestamp": "2025-01-31T01:45:00.000Z"
    }
  ]
}
```

## Benefits for Users

1. **Community Intelligence**: Everyone benefits from shared insights
2. **Real-time Updates**: Latest injury news, form, and stats
3. **Persistent Memory**: AI remembers information across sessions
4. **Collaborative Knowledge**: Users build FPL wisdom together
5. **Always Current**: Community keeps data fresh and relevant

## Technical Implementation

The system uses a hybrid approach:
- **Client-side**: Fast localStorage caching for immediate access
- **Server-side**: Persistent JSON file storage for true global access
- **Fallback system**: Graceful degradation if server unavailable
- **Merge strategy**: Intelligent conflict resolution by timestamp

This creates a robust, scalable system where FPL community knowledge accumulates and benefits everyone!