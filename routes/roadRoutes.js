const express = require('express');
const router = express.Router();

module.exports = (trafficGraph) => {
    // Get all roads
    router.get('/', (req, res) => {
        const network = trafficGraph.getNetworkData();
        res.json(network.roads);
    });

    // Add a new road
    router.post('/', (req, res) => {
        const { from, to, distance } = req.body;
        
        if (!from || !to || distance === undefined) {
            return res.status(400).json({ 
                error: 'from, to, and distance are required' 
            });
        }
        
        if (from === to) {
            return res.status(400).json({ 
                error: 'Cannot create a road from an intersection to itself' 
            });
        }
        
        if (distance <= 0) {
            return res.status(400).json({ 
                error: 'Distance must be greater than 0' 
            });
        }
        
        const success = trafficGraph.addEdge(from, to, distance);
        
        if (success) {
            res.status(201).json({
                message: 'Road added successfully',
                road: { from, to, distance, trafficDensity: 0 }
            });
        } else {
            res.status(400).json({ 
                error: 'One or both intersections do not exist' 
            });
        }
    });

    // Get roads connected to an intersection
    router.get('/:intersectionId', (req, res) => {
        const { intersectionId } = req.params;
        
        if (!trafficGraph.adjacencyList.has(intersectionId)) {
            return res.status(404).json({ 
                error: 'Intersection not found' 
            });
        }
        
        const connectedRoads = [];
        const neighbors = trafficGraph.adjacencyList.get(intersectionId);
        
        for (const [to, data] of neighbors.entries()) {
            connectedRoads.push({
                from: intersectionId,
                to,
                distance: data.distance,
                trafficDensity: data.trafficDensity,
                lastUpdated: data.lastUpdated
            });
        }
        
        res.json(connectedRoads);
    });

    // Delete a road
    router.delete('/', (req, res) => {
        const { from, to } = req.body;
        
        if (!from || !to) {
            return res.status(400).json({ 
                error: 'Both from and to are required' 
            });
        }
        
        if (!trafficGraph.adjacencyList.has(from) || 
            !trafficGraph.adjacencyList.has(to)) {
            return res.status(404).json({ 
                error: 'One or both intersections not found' 
            });
        }
        
        // Check if the road exists
        const fromNode = trafficGraph.adjacencyList.get(from);
        const toNode = trafficGraph.adjacencyList.get(to);
        
        if (!fromNode.has(to) || !toNode.has(from)) {
            return res.status(404).json({ 
                error: 'Road not found' 
            });
        }
        
        // Remove the road (both directions since it's undirected)
        fromNode.delete(to);
        toNode.delete(from);
        
        res.json({ 
            message: 'Road deleted successfully' 
        });
    });

    return router;
};
