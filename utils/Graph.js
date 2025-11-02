class Graph {
    constructor() {
        this.adjacencyList = new Map();
        this.intersections = new Map();
    }

    // Add a new intersection (node) to the graph
    addNode(id, name) {
        if (!this.adjacencyList.has(id)) {
            this.adjacencyList.set(id, new Map());
            this.intersections.set(id, {
                id,
                name,
                signalStatus: 'red', // default signal status
                lastChange: Date.now()
            });
            return true;
        }
        return false;
    }

    // Add a road (edge) between two intersections
    addEdge(from, to, distance) {
        if (!this.adjacencyList.has(from) || !this.adjacencyList.has(to)) {
            return false;
        }
        
        // Add bidirectional connection
        this.adjacencyList.get(from).set(to, { 
            distance: parseInt(distance),
            trafficDensity: 0, // initial traffic density
            lastUpdated: Date.now()
        });
        
        this.adjacencyList.get(to).set(from, {
            distance: parseInt(distance),
            trafficDensity: 0,
            lastUpdated: Date.now()
        });
        
        return true;
    }

    // Update traffic density for a road
    updateTraffic(from, to, density) {
        if (this.adjacencyList.has(from) && this.adjacencyList.get(from).has(to)) {
            const road = this.adjacencyList.get(from).get(to);
            road.trafficDensity = Math.min(1, Math.max(0, parseFloat(density))); // Ensure density is between 0 and 1
            road.lastUpdated = Date.now();
            return true;
        }
        return false;
    }

    // Get the shortest path using Dijkstra's algorithm with traffic consideration
    getShortestPathDijkstra(start, end) {
        if (!this.adjacencyList.has(start) || !this.adjacencyList.has(end)) {
            return null;
        }

        const distances = {};
        const previous = {};
        const nodes = new Set();
        let path = [];

        // Initialize distances
        for (const node of this.adjacencyList.keys()) {
            distances[node] = node === start ? 0 : Infinity;
            nodes.add(node);
        }

        while (nodes.size) {
            // Find node with smallest distance
            let current = null;
            for (const node of nodes) {
                if (current === null || distances[node] < distances[current]) {
                    current = node;
                }
            }

            if (current === end || distances[current] === Infinity) {
                break;
            }

            nodes.delete(current);

            // Update distances to neighbors
            for (const [neighbor, data] of this.adjacencyList.get(current).entries()) {
                // Calculate weight considering both distance and traffic
                const trafficFactor = 1 + (data.trafficDensity * 2); // Traffic increases effective distance
                const distance = distances[current] + (data.distance * trafficFactor);
                
                if (distance < distances[neighbor]) {
                    distances[neighbor] = distance;
                    previous[neighbor] = current;
                }
            }
        }

        // Reconstruct path
        let current = end;
        while (previous[current]) {
            path.unshift(current);
            current = previous[current];
        }
        path.unshift(start);

        return distances[end] !== Infinity ? path : null;
    }

    // Automatically adjust traffic signals based on traffic density
    autoAdjustSignals() {
        const now = Date.now();
        const SIGNAL_CYCLE = 60000; // 1 minute cycle
        
        this.intersections.forEach((intersection, id) => {
            const timeInCycle = (now - intersection.lastChange) % SIGNAL_CYCLE;
            
            // If it's time to change the signal
            if (timeInCycle < 1000) { // Check every second
                // Simple logic: if most incoming roads have high traffic, keep green longer
                let totalDensity = 0;
                let count = 0;
                
                // Check all incoming roads
                for (const [from, neighbors] of this.adjacencyList.entries()) {
                    if (neighbors.has(id)) {
                        totalDensity += neighbors.get(id).trafficDensity;
                        count++;
                    }
                }
                
                const avgDensity = count > 0 ? totalDensity / count : 0;
                
                // Change signal if needed
                if (intersection.signalStatus === 'red' && avgDensity > 0.5) {
                    intersection.signalStatus = 'green';
                    intersection.lastChange = now;
                } else if (intersection.signalStatus === 'green' && avgDensity < 0.3) {
                    intersection.signalStatus = 'red';
                    intersection.lastChange = now;
                }
            }
        });
    }

    // Get all intersections and roads for API responses
    getNetworkData() {
        const intersections = Array.from(this.intersections.values());
        const roads = [];
        
        // Convert adjacency list to array of roads
        const added = new Set();
        for (const [from, neighbors] of this.adjacencyList.entries()) {
            for (const [to, data] of neighbors.entries()) {
                // Avoid duplicate roads (since graph is undirected)
                const key = [from, to].sort().join('-');
                if (!added.has(key)) {
                    roads.push({
                        from,
                        to,
                        distance: data.distance,
                        trafficDensity: data.trafficDensity,
                        lastUpdated: data.lastUpdated
                    });
                    added.add(key);
                }
            }
        }
        
        return { intersections, roads };
    }
}

module.exports = Graph;
