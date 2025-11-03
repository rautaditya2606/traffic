# Traffic Management System

A traffic management system that calculates optimal routes between intersections while considering real-time traffic conditions.

## Data Structures and Algorithms

### 1. Graph Data Structure

#### Implementation: `utils/Graph.js`

The core of the system is a **weighted, undirected graph** implemented using adjacency lists. The graph is used to model the road network where:

- **Nodes (Vertices)**: Represent intersections in the road network
- **Edges**: Represent roads connecting intersections
- **Weights**: Represent both distance and traffic conditions

#### Key Data Structures:

1. **`adjacencyList` (Map)**:
   - Key: Intersection ID (String/Number)
   - Value: Map of connected intersections and their corresponding road data

2. **`intersections` (Map)**:
   - Key: Intersection ID (String/Number)
   - Value: Object containing intersection details (id, name, signalStatus, lastChange)

### 2. Algorithms

#### Dijkstra's Algorithm
- **Location**: `getShortestPathDijkstra` method in `Graph.js`
- **Purpose**: Finds the shortest path between two intersections considering both distance and traffic conditions
- **Time Complexity**: O((V + E) log V) where V is number of vertices and E is number of edges
- **Key Features**:
  - Considers both distance and traffic density
  - Uses a priority queue (simulated with a Set and linear search for simplicity)
  - Traffic-aware routing with dynamic weights

### 3. Traffic Management

- **Traffic Updates**:
  - Traffic density is stored per road segment (edge)
  - Each update includes a timestamp for freshness
  - Traffic affects the effective weight of edges in real-time

## Project Structure

```
traffic-system/
├── utils/
│   └── Graph.js          # Core graph implementation and algorithms
├── routes/
│   ├── routeRoutes.js    # API endpoints for route calculations
│   └── trafficRoutes.js  # Endpoints for traffic updates
├── views/
│   └── index.ejs         # Frontend interface
└── package.json          # Project dependencies
```

## API Endpoints

### Route Calculation
- `GET /route?from=<from_id>&to=<to_id>`
  - Returns the optimal path between two intersections
  - Considers both distance and current traffic conditions

### Traffic Updates
- Endpoints defined in `trafficRoutes.js` for updating traffic conditions

## How It Works

1. The system models the road network as a graph where intersections are nodes and roads are edges.
2. Each edge has:
   - Base distance (static)
   - Traffic density (dynamic, 0-1 scale)
   - Last update timestamp
3. When calculating routes, the system:
   - Considers both distance and traffic
   - Applies a traffic factor to increase the effective distance of congested roads
   - Uses Dijkstra's algorithm to find the optimal path

## Dependencies

- Express.js: Web server framework
- EJS: Template engine for views
- (Other dependencies listed in package.json)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Access the web interface at `http://localhost:3000`

## Future Improvements

- Implement A* algorithm with heuristics for better performance
- Add real-time traffic data integration
- Include turn restrictions and one-way streets
- Add support for different vehicle types and their routing preferences
