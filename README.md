# F1 Driver Standings Tracker

An interactive web application for tracking F1 driver standings and predicting future race outcomes.

## Features

- **Live F1 Data**: Fetches real-time data from the Ergast F1 API
- **Championship Standings**: View current driver standings with calculated points
- **Race Results**: See actual results for completed races
- **Sprint Races**: Full support for sprint race weekends with separate columns
- **Prediction System**: Predict future race outcomes with intelligent defaults
- **Collapsible Columns**: Hide/show races and gap columns
- **Points Calculator**: Real-time points calculation based on predictions

## Project Structure

```
f1/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── styles.css     # All styles
│   └── js/
│       ├── app.js         # Main application controller
│       ├── components/
│       │   └── tableRenderer.js    # Table rendering logic
│       ├── services/
│       │   └── apiService.js       # API communication layer
│       └── utils/
│           ├── pointsCalculator.js # Points calculation logic
│           └── predictionManager.js # Prediction management
├── package.json           # Project metadata and scripts
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Python 3.x (for local development server)
- Modern web browser with ES6 module support

### Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd f1
   ```

### Running the Application

#### Option 1: Using npm script
```bash
npm start
```

#### Option 2: Using Python directly
```bash
python3 -m http.server 8000 --directory public
```

Then open your browser and navigate to:
```
http://localhost:8000
```

## Usage

### Controls

- **🔄 Refresh Data**: Reload the latest F1 data from the API
- **↺ Reset Predictions**: Clear all manual predictions
- **⊟ Collapse All Future**: Hide all upcoming races and gap columns
- **⊞ Expand All**: Show all columns

### Making Predictions

1. For future races, use the dropdown menus in each cell to select predicted finishing positions
2. Predictions automatically use:
   - Qualifying results (if available)
   - Current championship positions (as fallback)
3. Points are recalculated in real-time as you make predictions

### Collapsing Columns

- Click on any future race header to toggle its visibility
- Collapsed races don't affect total points calculation
- Gap columns can also be collapsed

## Architecture

### Frontend Structure

#### `app.js` - Main Controller
- Coordinates all components
- Manages application state
- Handles user interactions

#### `apiService.js` - API Layer
- Encapsulates all API calls
- Handles data fetching and error handling
- Provides clean interface for data access

#### `tableRenderer.js` - View Component
- Handles all table rendering logic
- Manages column visibility
- Generates HTML dynamically

#### `pointsCalculator.js` - Business Logic
- Calculates driver points
- Implements F1 points system
- Handles sprint race points

#### `predictionManager.js` - State Management
- Manages user predictions
- Provides default predictions
- Handles prediction import/export

### Design Patterns

- **Separation of Concerns**: Clear separation between data, logic, and presentation
- **Service Layer**: API calls isolated in dedicated service
- **Component-Based**: Modular components for easy maintenance
- **Event Delegation**: Efficient event handling for dynamic content

## Future Expansion Ideas

### Backend Integration
- Node.js/Express server for data caching
- Database for storing user predictions
- User authentication system
- WebSocket for real-time updates

### Additional Features
- Constructor standings tracker
- Historical season comparison
- Advanced statistics and analytics
- Social sharing of predictions
- Multiple prediction scenarios
- Export predictions to PDF/CSV

### Technical Improvements
- State management library (Redux/MobX)
- Build system (Webpack/Vite)
- TypeScript for type safety
- Unit and integration tests
- Progressive Web App (PWA) support
- Dark/light theme toggle

## API Reference

This application uses the [Ergast F1 API](https://api.jolpi.ca/ergast/):
- Driver Standings: `/f1/current/driverstandings`
- Race Schedule: `/f1/current`
- Race Results: `/f1/{season}/{round}/results`
- Sprint Results: `/f1/{season}/{round}/sprint`
- Qualifying: `/f1/{season}/{round}/qualifying`

## Browser Compatibility

- Chrome/Edge 89+
- Firefox 88+
- Safari 14.1+
- Any browser with ES6 module support

## License

MIT License - Feel free to use and modify as needed
