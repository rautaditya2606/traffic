const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

// Import routes
const intersectionRoutes = require('./routes/intersectionRoutes');
const roadRoutes = require('./routes/roadRoutes');
const trafficRoutes = require('./routes/trafficRoutes');
const routeRoutes = require('./routes/routeRoutes');

// Import Graph
const Graph = require('./utils/Graph');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Initialize graph
const trafficGraph = new Graph();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Send initial data
    socket.emit('network-update', trafficGraph.getNetworkData());
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Function to save data to db.json
const saveData = () => {
    fs.writeFileSync(
        path.join(__dirname, 'db.json'),
        JSON.stringify(trafficGraph.getNetworkData(), null, 2)
    );
};

// Function to save and emit network update
const saveAndEmitNetworkUpdate = () => {
    saveData();
    io.emit('network-update', trafficGraph.getNetworkData());
};

// Routes (must be after saveAndEmitNetworkUpdate is defined)
app.use('/api/intersection', intersectionRoutes(trafficGraph, saveAndEmitNetworkUpdate));
app.use('/api/road', roadRoutes(trafficGraph, saveAndEmitNetworkUpdate));
app.use('/api/traffic', trafficRoutes(trafficGraph));
app.use('/api/route', routeRoutes(trafficGraph));

// Serve the main dashboard
app.get('/', (req, res) => {
    const network = trafficGraph.getNetworkData();
    res.render('index', { 
        intersections: network.intersections,
        roads: network.roads
    });
});

// API endpoint to get current network data
app.get('/api/network', (req, res) => {
    res.json(trafficGraph.getNetworkData());
});

// Load data from db.json if it exists
const loadData = () => {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json'), 'utf8'));
        
        // Add intersections
        data.intersections.forEach(intersection => {
            trafficGraph.addNode(intersection.id, intersection.name);
            // Update signal status
            const node = trafficGraph.intersections.get(intersection.id);
            if (node) {
                node.signalStatus = intersection.signalStatus;
                node.lastChange = intersection.lastChange || Date.now();
            }
        });
        
        // Add roads
        data.roads.forEach(road => {
            trafficGraph.addEdge(road.from, road.to, road.distance);
            // Update traffic density
            trafficGraph.updateTraffic(road.from, road.to, road.trafficDensity);
        });
        
        console.log('Data loaded from db.json');
    } catch (err) {
        console.log('No existing data found, starting with empty graph');
    }
};

// Function to simulate traffic updates
const simulateTrafficUpdates = () => {
    setInterval(() => {
        const network = trafficGraph.getNetworkData();
        
        // Randomly update traffic density on some roads
        network.roads.forEach(road => {
            if (Math.random() > 0.7) { // 30% chance to update each road
                const newDensity = Math.min(1, Math.max(0, 
                    road.trafficDensity + (Math.random() * 0.2 - 0.1) // Random change between -0.1 and 0.1
                ));
                trafficGraph.updateTraffic(road.from, road.to, newDensity);
            }
        });
        
        // Auto-adjust signals
        trafficGraph.autoAdjustSignals();
        
        // Save data
        saveData();
        
        // Emit update to all connected clients
        io.emit('network-update', trafficGraph.getNetworkData());
    }, 5000); // Update every 5 seconds
};

// Initialize the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Load existing data
    loadData();
    
    // If no data exists, seed with sample data
    if (trafficGraph.intersections.size === 0) {
        // Add sample intersections
        trafficGraph.addNode('A', 'Downtown');
        trafficGraph.addNode('B', 'Midtown');
        trafficGraph.addNode('C', 'Uptown');
        trafficGraph.addNode('D', 'Suburb');
        
        // Add sample roads with distances
        trafficGraph.addEdge('A', 'B', 2);
        trafficGraph.addEdge('B', 'C', 3);
        trafficGraph.addEdge('A', 'C', 5);
        trafficGraph.addEdge('B', 'D', 4);
        trafficGraph.addEdge('C', 'D', 2);
        
        // Set initial signal statuses
        trafficGraph.intersections.get('A').signalStatus = 'green';
        trafficGraph.intersections.get('B').signalStatus = 'red';
        trafficGraph.intersections.get('C').signalStatus = 'green';
        trafficGraph.intersections.get('D').signalStatus = 'red';
        
        // Save the initial data
        saveData();
    }
    
    // Start traffic simulation
    simulateTrafficUpdates();
});

module.exports = { app, server, trafficGraph };
