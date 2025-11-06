const express = require('express');
const router = express.Router();

module.exports = (trafficGraph, saveAndEmitNetworkUpdate) => {
    // Get all intersections
    router.get('/', (req, res) => {
        const network = trafficGraph.getNetworkData();
        res.json(network.intersections);
    });

    // Add a new intersection
    router.post('/', (req, res) => {
        const { id, name } = req.body;
        
        if (!id || !name) {
            return res.status(400).json({ error: 'Both id and name are required' });
        }
        
        const success = trafficGraph.addNode(id, name);
        
        if (success) {
            // Save data and emit socket update if callback is provided
            if (saveAndEmitNetworkUpdate) {
                saveAndEmitNetworkUpdate();
            }
            
            res.status(201).json({
                message: 'Intersection added successfully',
                intersection: trafficGraph.intersections.get(id)
            });
        } else {
            res.status(400).json({ error: 'Intersection with this ID already exists' });
        }
    });

    // Get a specific intersection
    router.get('/:id', (req, res) => {
        const intersection = trafficGraph.intersections.get(req.params.id);
        
        if (intersection) {
            res.json(intersection);
        } else {
            res.status(404).json({ error: 'Intersection not found' });
        }
    });

    // Update an intersection
    router.put('/:id', (req, res) => {
        const { name, signalStatus } = req.body;
        const intersection = trafficGraph.intersections.get(req.params.id);
        
        if (!intersection) {
            return res.status(404).json({ error: 'Intersection not found' });
        }
        
        if (name !== undefined) {
            intersection.name = name;
        }
        
        if (signalStatus && ['red', 'yellow', 'green'].includes(signalStatus)) {
            intersection.signalStatus = signalStatus;
            intersection.lastChange = Date.now();
        }
        
        res.json({
            message: 'Intersection updated successfully',
            intersection
        });
    });

    // Delete an intersection
    router.delete('/:id', (req, res) => {
        const id = req.params.id;
        
        if (!trafficGraph.intersections.has(id)) {
            return res.status(404).json({ error: 'Intersection not found' });
        }
        
        // Remove all edges connected to this node
        trafficGraph.adjacencyList.delete(id);
        
        // Remove this node from other nodes' adjacency lists
        for (const [node, neighbors] of trafficGraph.adjacencyList.entries()) {
            if (neighbors.has(id)) {
                neighbors.delete(id);
            }
        }
        
        // Remove the intersection
        trafficGraph.intersections.delete(id);
        
        // Save data and emit socket update if callback is provided
        if (saveAndEmitNetworkUpdate) {
            saveAndEmitNetworkUpdate();
        }
        
        res.json({ message: 'Intersection deleted successfully' });
    });

    return router;
};
