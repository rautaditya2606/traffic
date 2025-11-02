const express = require('express');
const router = express.Router();

module.exports = (trafficGraph) => {
    // Update traffic density on a road
    router.post('/', (req, res) => {
        const { from, to, density } = req.body;
        
        if (from === undefined || to === undefined || density === undefined) {
            return res.status(400).json({ 
                error: 'from, to, and density are required' 
            });
        }
        
        const densityValue = parseFloat(density);
        
        if (isNaN(densityValue) || densityValue < 0 || densityValue > 1) {
            return res.status(400).json({ 
                error: 'Density must be a number between 0 and 1' 
            });
        }
        
        const success = trafficGraph.updateTraffic(from, to, densityValue);
        
        if (success) {
            // Update the reverse direction as well (since it's an undirected graph)
            trafficGraph.updateTraffic(to, from, densityValue);
            
            res.json({
                message: 'Traffic density updated successfully',
                road: { from, to, density: densityValue }
            });
        } else {
            res.status(404).json({ 
                error: 'Road not found' 
            });
        }
    });
    
    // Get traffic data for all roads
    router.get('/', (req, res) => {
        const network = trafficGraph.getNetworkData();
        const trafficData = network.roads.map(road => ({
            from: road.from,
            to: road.to,
            trafficDensity: road.trafficDensity,
            lastUpdated: road.lastUpdated
        }));
        
        res.json(trafficData);
    });
    
    // Get traffic data for a specific road
    router.get('/:from/:to', (req, res) => {
        const { from, to } = req.params;
        
        if (!trafficGraph.adjacencyList.has(from) || 
            !trafficGraph.adjacencyList.get(from).has(to)) {
            return res.status(404).json({ 
                error: 'Road not found' 
            });
        }
        
        const roadData = trafficGraph.adjacencyList.get(from).get(to);
        
        res.json({
            from,
            to,
            distance: roadData.distance,
            trafficDensity: roadData.trafficDensity,
            lastUpdated: roadData.lastUpdated
        });
    });

    return router;
};
