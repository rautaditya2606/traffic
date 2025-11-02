const express = require('express');
const router = express.Router();

module.exports = (trafficGraph) => {
    // Calculate the shortest path between two intersections
    router.get('/', (req, res) => {
        const { from, to } = req.query;
        
        if (!from || !to) {
            return res.status(400).json({ 
                error: 'Both from and to parameters are required' 
            });
        }
        
        if (!trafficGraph.intersections.has(from)) {
            return res.status(404).json({ 
                error: `Intersection '${from}' not found` 
            });
        }
        
        if (!trafficGraph.intersections.has(to)) {
            return res.status(404).json({ 
                error: `Intersection '${to}' not found` 
            });
        }
        
        const path = trafficGraph.getShortestPathDijkstra(from, to);
        
        if (!path || path.length === 0) {
            return res.status(404).json({ 
                error: 'No path found between the specified intersections' 
            });
        }
        
        // Calculate total distance and traffic information
        let totalDistance = 0;
        const segments = [];
        
        for (let i = 0; i < path.length - 1; i++) {
            const current = path[i];
            const next = path[i + 1];
            
            if (trafficGraph.adjacencyList.has(current) && 
                trafficGraph.adjacencyList.get(current).has(next)) {
                
                const road = trafficGraph.adjacencyList.get(current).get(next);
                totalDistance += road.distance;
                
                segments.push({
                    from: current,
                    to: next,
                    distance: road.distance,
                    trafficDensity: road.trafficDensity,
                    trafficStatus: getTrafficStatus(road.trafficDensity),
                    signalStatus: trafficGraph.intersections.get(next).signalStatus
                });
            }
        }
        
        res.json({
            from,
            to,
            path,
            totalDistance,
            segments,
            timestamp: new Date().toISOString()
        });
    });
    
    // Helper function to get traffic status based on density
    function getTrafficStatus(density) {
        if (density < 0.3) return 'Light';
        if (density < 0.7) return 'Moderate';
        return 'Heavy';
    }

    return router;
};
