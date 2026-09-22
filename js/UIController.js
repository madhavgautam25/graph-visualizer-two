import { Node } from "./Node.js";
import { createMathFunction } from "./MathGraphParser.js";

class UIController {

    constructor(
        graph,
        renderer,
        animationController,
        interactionController,
        algorithms
    ) {

        this.graph = graph;
        this.renderer = renderer;

        this.animationController =
            animationController;

        this.interactionController =
            interactionController;

        this.algorithms = algorithms;


        this.graphType =
            document.getElementById("graphType");

        this.weightedGraph =
            document.getElementById("weightedGraph");

        this.weightGroup =
            document.getElementById("weightGroup");

        this.edgeWeight =
            document.getElementById("edgeWeight");


        this.algorithm =
            document.getElementById("algorithm");

        this.startNode =
            document.getElementById("startNode");

        this.targetNode =
            document.getElementById("targetNode");

        this.targetGroup =
            document.getElementById("targetGroup");


        this.runAlgorithm =
            document.getElementById("runAlgorithm");

        this.speedSlider =
            document.getElementById("speedSlider");

        this.speedValue =
            document.getElementById("speedValue");

        this.pauseResume =
            document.getElementById("pauseResume");

        this.resetVisualization =
            document.getElementById("resetVisualization");

        this.clearGraph =
            document.getElementById("clearGraph");


        this.statusMessage =
            document.getElementById("statusMessage");

        this.nodeCount =
            document.getElementById("nodeCount");

        this.edgeCount =
            document.getElementById("edgeCount");

        this.emptyMessage =
            document.getElementById("emptyMessage");

        this.equationInput =
            document.getElementById("equationInput");

        this.xMinInput =
            document.getElementById("xMinInput");

        this.xMaxInput =
            document.getElementById("xMaxInput");

        this.yMinInput =
            document.getElementById("yMinInput");

        this.yMaxInput =
            document.getElementById("yMaxInput");

        this.stepInput =
            document.getElementById("stepInput");

        this.generateMathGraph =
            document.getElementById("generateMathGraph");


        this.setupEvents();

        this.connectInteractionController();

        this.updateUI();
    }


    setupEvents() {

        this.graphType.addEventListener(
            "change",
            () => this.handleGraphTypeChange()
        );


        this.weightedGraph.addEventListener(
            "change",
            () => this.handleWeightedChange()
        );


        this.algorithm.addEventListener(
            "change",
            () => this.handleAlgorithmChange()
        );


        this.startNode.addEventListener(
            "change",
            () => this.handleEndpointChange()
        );


        this.targetNode.addEventListener(
            "change",
            () => this.handleEndpointChange()
        );


        this.runAlgorithm.addEventListener(
            "click",
            () => this.runSelectedAlgorithm()
        );


        this.speedSlider.addEventListener(
            "input",
            () => this.handleSpeedChange()
        );


        this.pauseResume.addEventListener(
            "click",
            () => this.handlePauseResume()
        );


        this.resetVisualization.addEventListener(
            "click",
            () => this.handleReset()
        );


        this.clearGraph.addEventListener(
            "click",
            () => this.handleClearGraph()
        );

        this.generateMathGraph.addEventListener(
            "click",
            () => this.handleGenerateMathGraph()
        );
    }


    connectInteractionController() {

        this.interactionController
            .onGetWeightedGraph = () => {

                return this.graph.weighted;
            };


        this.interactionController
            .onGetEdgeWeight = () => {

                return this.getEdgeWeight();
            };


        this.interactionController
            .onGraphChange = () => {

                this.updateUI();
            };
    }


    handleGraphTypeChange() {

        if (this.isRunning()) {
            return;
        }


        this.graph.directed =
            this.graphType.value === "directed";


        this.rebuildAdjacencyList();

        this.renderer.draw();

        this.updateUI();


        this.setStatus(
            this.graph.directed
                ? "Directed graph selected."
                : "Undirected graph selected."
        );
    }


    handleWeightedChange() {

        if (this.isRunning()) {
            return;
        }


        this.graph.weighted =
            this.weightedGraph.checked;


        this.weightGroup.classList.toggle(
            "hidden",
            !this.graph.weighted
        );


        this.renderer.draw();


        this.setStatus(
            this.graph.weighted
                ? "Weighted graph enabled."
                : "Weighted graph disabled."
        );
    }


    handleAlgorithmChange() {

        const algorithm =
            this.algorithm.value;


        if (algorithm === "dijkstra") {

            this.graph.weighted = true;

            this.weightedGraph.checked = true;

            this.weightGroup.classList.remove(
                "hidden"
            );
        }


        this.targetGroup.classList.remove(
            "hidden"
        );


        this.updateUI();
    }


    handleEndpointChange() {

        if (this.isRunning()) {
            return;
        }


        this.restoreStartTargetStates();
    }


    handleSpeedChange() {

        const speed =
            Number(this.speedSlider.value);


        this.speedValue.textContent =
            `${speed} ms`;


        this.animationController.setSpeed(
            speed
        );
    }


    handlePauseResume() {

        if (!this.isRunning()) {
            return;
        }


        this.animationController.togglePause();


        if (
            this.animationController.isPaused
        ) {

            this.pauseResume.textContent =
                "Resume";

            this.setStatus(
                "Animation paused."
            );

        } else {

            this.pauseResume.textContent =
                "Pause";

            this.setStatus(
                "Animation resumed."
            );
        }
    }


    handleReset() {

        this.animationController.reset();

        this.restoreStartTargetStates();

        this.pauseResume.textContent =
            "Pause";


        this.setStatus(
            "Visualization reset."
        );


        this.updateUI();
    }


    handleClearGraph() {

        if (this.isRunning()) {
            return;
        }


        this.graph.clear();

        this.renderer.clearMathPlot();

        this.interactionController.resetCounter();

        this.animationController.reset();


        this.startNode.innerHTML =
            `<option value="">Select Start Node</option>`;

        this.targetNode.innerHTML =
            `<option value="">Select Target Node</option>`;


        this.pauseResume.textContent =
            "Pause";


        this.setStatus(
            "Graph cleared. Create a new graph."
        );


        this.renderer.draw();

        this.updateUI();
    }


    handleGenerateMathGraph() {

        if (this.isRunning()) {
            return;
        }

        const xMin = Number(this.xMinInput.value);
        const xMax = Number(this.xMaxInput.value);
        const step = Number(this.stepInput.value);
        const hasYMin = this.yMinInput.value.trim() !== "";
        const hasYMax = this.yMaxInput.value.trim() !== "";
        const requestedYMin = Number(this.yMinInput.value);
        const requestedYMax = Number(this.yMaxInput.value);
        const pointCount = Math.floor((xMax - xMin) / step) + 1;

        if (!Number.isFinite(xMin) || !Number.isFinite(xMax) ||
            !Number.isFinite(step) || xMax <= xMin || step <= 0) {
            this.setStatus("Use a finite range where X max is greater than X min and step is positive.");
            return;
        }

        if (hasYMin !== hasYMax ||
            (hasYMin && (!Number.isFinite(requestedYMin) || !Number.isFinite(requestedYMax) ||
                requestedYMax <= requestedYMin))) {
            this.setStatus("Enter both Y limits, with Y max greater than Y min, or leave both blank for automatic scaling.");
            return;
        }

        if (pointCount > 600) {
            this.setStatus("That range creates too many points. Increase the step or narrow the range.");
            return;
        }

        let evaluate;

        try {
            evaluate = createMathFunction(this.equationInput.value);
        } catch (error) {
            this.setStatus(`Invalid equation: ${error.message}.`);
            return;
        }

        const samples = [];

        for (let index = 0; index < pointCount; index++) {
            const x = index === pointCount - 1
                ? xMax
                : xMin + index * step;
            let y;

            try {
                y = evaluate(x);
            } catch (error) {
                y = NaN;
            }

            samples.push({
                x: x,
                y: Number.isFinite(y) ? y : null,
                index: index
            });
        }

        const finiteSamples = samples.filter(sample => sample.y !== null);

        if (finiteSamples.length < 2) {
            this.setStatus("The equation produced fewer than two finite points in this range.");
            return;
        }

        const yValues = finiteSamples.map(sample => sample.y);
        const sampledYMin = Math.min(...yValues);
        const sampledYMax = Math.max(...yValues);
        const sampledYRange = sampledYMax - sampledYMin;
        const automaticYPadding =
            sampledYRange === 0 ? 0.5 : sampledYRange * 0.08;
        const plotYMin = hasYMin
            ? requestedYMin
            : sampledYMin - automaticYPadding;
        const plotYMax = hasYMax
            ? requestedYMax
            : sampledYMax + automaticYPadding;
        const actualYRange = plotYMax - plotYMin;
        const yRange = actualYRange || 1;
        const margin = Math.max(
            32,
            Math.min(64, Math.min(this.renderer.width, this.renderer.height) * 0.08)
        );
        const plotWidth = Math.max(margin * 2, this.renderer.width - margin * 2);
        const plotHeight = Math.max(margin * 2, this.renderer.height - margin * 2);
        const xRange = xMax - xMin;
        const generatedNodes = [];

        this.graph.clear();
        this.interactionController.resetCounter();

        this.renderer.setMathPlot({
            xMin: xMin,
            xMax: xMax,
            yMin: plotYMin,
            yMax: plotYMax,
            margin: margin
        });

        const plottedSamples = [];
        const minimumNodeDistance =
            this.renderer.nodeRadius * 2 + Math.max(4, this.renderer.nodeRadius * 0.25);

        for (const sample of samples) {
            if (sample.y === null || sample.y < plotYMin || sample.y > plotYMax) {
                continue;
            }

            const canvasX = margin + ((sample.x - xMin) / xRange) * plotWidth;
            const canvasY = margin + ((plotYMax - sample.y) / (plotYMax - plotYMin)) * plotHeight;

            const isFarEnough =
                plottedSamples.every(previous => {
                    const dx = canvasX - previous.canvasX;
                    const dy = canvasY - previous.canvasY;
                    return Math.sqrt(dx * dx + dy * dy) >= minimumNodeDistance;
                });

            if (!isFarEnough) {
                continue;
            }

            plottedSamples.push({
                sample: sample,
                canvasX: canvasX,
                canvasY: canvasY
            });
        }

        if (plottedSamples.length < 2) {
            this.graph.clear();
            this.renderer.clearMathPlot();
            this.renderer.draw();
            this.updateUI();
            this.setStatus("The selected Y range contains fewer than two graph points.");
            return;
        }

        for (const plottedSample of plottedSamples) {
            const sample = plottedSample.sample;
            const node = new Node(
                generatedNodes.length + 1,
                plottedSample.canvasX,
                plottedSample.canvasY
            );

            this.graph.addNode(node);
            generatedNodes.push({ node: node, sample: sample });
        }

        for (let index = 1; index < generatedNodes.length; index++) {
            const previous = generatedNodes[index - 1];
            const current = generatedNodes[index];
            const hasDiscontinuity = samples
                .slice(previous.sample.index + 1, current.sample.index + 1)
                .some(sample => sample.y === null || sample.y < plotYMin || sample.y > plotYMax);
            const jump = Math.abs(current.sample.y - previous.sample.y);

            if (!hasDiscontinuity && jump <= Math.max(50, yRange * 0.75)) {
                const dx = current.node.x - previous.node.x;
                const dy = current.node.y - previous.node.y;
                const weight = Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy)));
                this.graph.addEdge(previous.node.id, current.node.id, weight);
            }
        }

        this.updateUI();
        this.renderer.draw();
        this.setStatus(`Generated ${generatedNodes.length} nodes from ${this.equationInput.value.trim()}.`);
    }


    async runSelectedAlgorithm() {

        if (this.isRunning()) {
            return;
        }


        if (this.graph.getNodeCount() === 0) {

            this.setStatus(
                "Add some nodes before running an algorithm."
            );

            return;
        }


        const startId =
            this.getSelectedNodeId(
                this.startNode
            );


        if (startId === null) {

            this.setStatus(
                "Please select a start node."
            );

            return;
        }


        const targetId =
            this.getSelectedNodeId(
                this.targetNode
            );


        if (
            this.algorithm.value === "dijkstra" &&
            this.hasInvalidWeight()
        ) {

            this.setStatus(
                "Dijkstra requires valid non-negative edge weights."
            );

            return;
        }


        this.graph.resetStates();


        const start =
            this.graph.getNode(startId);


        if (start) {
            start.isStart = true;
        }


        if (targetId !== null) {

            const target =
                this.graph.getNode(targetId);


            if (target) {
                target.isTarget = true;
            }
        }


        this.renderer.draw();


        let steps = [];


        if (this.algorithm.value === "bfs") {

            steps =
                this.algorithms.bfs(
                    this.graph,
                    startId,
                    targetId
                );
        }


        else if (this.algorithm.value === "dfs") {

            steps =
                this.algorithms.dfs(
                    this.graph,
                    startId,
                    targetId
                );
        }


        else if (this.algorithm.value === "dijkstra") {

            steps =
                this.algorithms.dijkstra(
                    this.graph,
                    startId,
                    targetId
                );
        }


        if (steps.length === 0) {

            this.setStatus(
                "No steps were generated."
            );

            this.restoreStartTargetStates();

            return;
        }


        this.setControlsDisabled(true);


        this.setStatus(
            `${this.getAlgorithmName()} is running...`
        );


        const result =
            await this.animationController.start(
                steps
            );


        this.setControlsDisabled(false);


        this.pauseResume.textContent =
            "Pause";


        if (!result.completed) {

            this.setStatus(
                "Visualization stopped."
            );

            return;
        }


        const noPath =
            steps.some(
                step => step.type === "no-path"
            );


        if (noPath) {

            this.setStatus(
                `No path exists from Node ${startId} to Node ${targetId}.`
            );

        } else {

            const pathStep =
                steps.find(
                    step => step.type === "path"
                );


            if (
                pathStep &&
                pathStep.distance !== undefined
            ) {

                this.setStatus(
                    `Shortest path found. Distance: ${pathStep.distance}`
                );

            } else {

                this.setStatus(
                    `${this.getAlgorithmName()} completed.`
                );
            }
        }


        this.restoreEndpointStates();
    }


    getSelectedNodeId(selectElement) {

        if (!selectElement.value) {
            return null;
        }


        const id =
            Number(selectElement.value);


        if (!this.graph.getNode(id)) {
            return null;
        }


        return id;
    }


    getEdgeWeight() {

        let weight =
            Number(this.edgeWeight.value);


        if (
            !Number.isFinite(weight) ||
            weight < 1
        ) {

            return 1;
        }


        return Math.round(weight);
    }


    hasInvalidWeight() {

        for (const edge of this.graph.edges) {

            const weight =
                Number(edge.weight);


            if (
                !Number.isFinite(weight) ||
                weight < 0
            ) {
                return true;
            }
        }


        return false;
    }


    updateUI() {

        this.updateNodeSelects();


        this.nodeCount.textContent =
            this.graph.getNodeCount();

        this.edgeCount.textContent =
            this.graph.getEdgeCount();


        this.emptyMessage.classList.toggle(
            "hidden",
            this.graph.getNodeCount() > 0
        );


        this.runAlgorithm.disabled =
            this.graph.getNodeCount() === 0;


        this.resetVisualization.disabled =
            this.graph.getNodeCount() === 0;
    }


    updateNodeSelects() {

    const oldStart =
        this.startNode.value;

    const oldTarget =
        this.targetNode.value;


    const startOptions = document.createDocumentFragment();
    const targetOptions = document.createDocumentFragment();
    const startPlaceholder = document.createElement("option");
    const targetPlaceholder = document.createElement("option");

    startPlaceholder.value = "";
    startPlaceholder.textContent = "Select Start Node";
    targetPlaceholder.value = "";
    targetPlaceholder.textContent = "Select Target Node";
    startOptions.appendChild(startPlaceholder);
    targetOptions.appendChild(targetPlaceholder);


    for (const node of this.graph.nodes.values()) {

        const startOption =
            document.createElement("option");

        startOption.value =
            node.id;

        startOption.textContent =
            `Node ${node.id}`;

        startOptions.appendChild(startOption);


        const targetOption =
            document.createElement("option");

        targetOption.value =
            node.id;

        targetOption.textContent =
            `Node ${node.id}`;

        targetOptions.appendChild(targetOption);
    }

    this.startNode.replaceChildren(startOptions);
    this.targetNode.replaceChildren(targetOptions);


    // Restore previous selection
    if (
        oldStart &&
        this.graph.getNode(Number(oldStart))
    ) {

        this.startNode.value =
            oldStart;
    }


    if (
        oldTarget &&
        this.graph.getNode(Number(oldTarget))
    ) {

        this.targetNode.value =
            oldTarget;
    }
}


    restoreStartTargetStates() {

        this.graph.resetStates();

        this.restoreEndpointStates();
    }


    restoreEndpointStates() {

        const startId =
            this.getSelectedNodeId(
                this.startNode
            );


        const targetId =
            this.getSelectedNodeId(
                this.targetNode
            );


        if (startId !== null) {

            const start =
                this.graph.getNode(startId);


            if (start) {
                start.isStart = true;
            }
        }


        if (
            targetId !== null &&
            targetId !== startId
        ) {

            const target =
                this.graph.getNode(targetId);


            if (target) {
                target.isTarget = true;
            }
        }


        this.renderer.draw();
    }


    rebuildAdjacencyList() {

        const oldEdges =
            [...this.graph.edges];


        this.graph.adjacencyList.clear();


        for (const node of this.graph.nodes.values()) {

            this.graph.adjacencyList.set(
                node.id,
                []
            );
        }


        for (const edge of oldEdges) {

            this.graph.adjacencyList
                .get(edge.from.id)
                .push({
                    node: edge.to,
                    weight: edge.weight,
                    edge: edge
                });


            if (!this.graph.directed) {

                this.graph.adjacencyList
                    .get(edge.to.id)
                    .push({
                        node: edge.from,
                        weight: edge.weight,
                        edge: edge
                    });
            }
        }
    }


    setControlsDisabled(disabled) {

        this.graphType.disabled =
            disabled;

        this.weightedGraph.disabled =
            disabled;

        this.edgeWeight.disabled =
            disabled;

        this.algorithm.disabled =
            disabled;

        this.startNode.disabled =
            disabled;

        this.targetNode.disabled =
            disabled;

        this.runAlgorithm.disabled =
            disabled;

        this.clearGraph.disabled =
            disabled;

        this.generateMathGraph.disabled =
            disabled;


        this.speedSlider.disabled =
            false;

        this.pauseResume.disabled =
            false;

        this.resetVisualization.disabled =
            false;
    }


    isRunning() {

        return this.animationController.isRunning;
    }


    setStatus(message) {

        this.statusMessage.textContent =
            message;
    }


    getAlgorithmName() {

        if (this.algorithm.value === "bfs") {
            return "BFS";
        }


        if (this.algorithm.value === "dfs") {
            return "DFS";
        }


        if (this.algorithm.value === "dijkstra") {
            return "Dijkstra";
        }


        return "Algorithm";
    }
}


export { UIController };