class Graph {
    constructor() {
        this.adjacencyList = new Map();
        this.intersections = new Map();
    }

    addNode(id, name) {
        if (!this.adjacencyList.has(id)) {
            this.adjacencyList.set(id, new Map());
            this.intersections.set(id, {
                id,
                name,
                signalStatus: 'red', 
                lastChange: Date.now()
            });
            return true;
        }
        return false;
    }

    addEdge(from, to, distance) {
        if (!this.adjacencyList.has(from) || !this.adjacencyList.has(to)) {
            return false;
        }
        
        this.adjacencyList.get(from).set(to, { 
            distance: parseInt(distance),
            trafficDensity: 0,
            lastUpdated: Date.now()
        });
        
        this.adjacencyList.get(to).set(from, {
            distance: parseInt(distance),
            trafficDensity: 0,
            lastUpdated: Date.now()
        });
        
        return true;
    }

    updateTraffic(from, to, density) {
        if (this.adjacencyList.has(from) && this.adjacencyList.get(from).has(to)) {
            const road = this.adjacencyList.get(from).get(to);
            road.trafficDensity = Math.min(1, Math.max(0, parseFloat(density)));
            road.lastUpdated = Date.now();
            return true;
        }
        return false;
    }

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

    // Track the current green signal and timing
    autoAdjustSignals() {
        const now = Date.now();
        const GREEN_TIME = 10000; // 10 seconds per signal
        
        // Find the currently green signal
        let currentGreen = null;
        for (const [id, intersection] of this.intersections.entries()) {
            if (intersection.signalStatus === 'green') {
                currentGreen = id;
                break;
            }
        }
        // If no signal is green, make the first one green
        if (!currentGreen && this.intersections.size > 0) {
            const firstId = this.intersections.keys().next().value;
            this.intersections.get(firstId).signalStatus = 'green';
            this.intersections.get(firstId).lastChange = now;
            this.intersections.get(firstId).lastIndex = 0;
            return;
        }
        
        // Check if it's time to switch to the next signal
        if (currentGreen) {
            const currentIntersection = this.intersections.get(currentGreen);
            const timeGreen = now - currentIntersection.lastChange;
            
            if (timeGreen >= GREEN_TIME) {
                // Find all adjacent intersections
                const adjacent = [];
                for (const [from, neighbors] of this.adjacencyList.entries()) {
                    if (neighbors.has(currentGreen)) {
                        adjacent.push(from);
                    }
                    if (from === currentGreen) {
                        for (const to of neighbors.keys()) {
                            adjacent.push(to);
                        }
                    }
                }
                
                // Filter out duplicates and the current green
                const uniqueAdjacent = [...new Set(adjacent)].filter(id => id !== currentGreen);
                
                // If there are adjacent intersections, pick the next one
                if (uniqueAdjacent.length > 0) {
                    // Initialize lastIndex if it doesn't exist
                    if (typeof currentIntersection.lastIndex === 'undefined') {
                        currentIntersection.lastIndex = -1;
                    }
                    
                    // Find the next intersection in a round-robin fashion
                    const nextIndex = (currentIntersection.lastIndex + 1) % uniqueAdjacent.length;
                    const nextGreen = uniqueAdjacent[nextIndex];
                    
                    // Update states
                    currentIntersection.signalStatus = 'red';
                    const nextIntersection = this.intersections.get(nextGreen);
                    nextIntersection.signalStatus = 'green';
                    nextIntersection.lastChange = now;
                    nextIntersection.lastIndex = nextIndex;
                }
            }
        }
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
