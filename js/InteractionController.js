import { Node } from "./Node.js";


class InteractionController {

    constructor(canvas, graph, renderer) {

        this.canvas = canvas;
        this.graph = graph;
        this.renderer = renderer;

        this.isDragging = false;

        this.draggedNode = null;

        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        this.edgeStartNode = null;

        this.mouseX = 0;
        this.mouseY = 0;

        this.nodeCounter = 1;

        this.setupEvents();
    }


    /* Attach mouse events */

    setupEvents() {

        this.canvas.addEventListener(
            "mousedown",
            event => this.handleMouseDown(event)
        );


        this.canvas.addEventListener(
            "mousemove",
            event => this.handleMouseMove(event)
        );


        this.canvas.addEventListener(
            "mouseup",
            event => this.handleMouseUp(event)
        );


        this.canvas.addEventListener(
            "mouseleave",
            event => this.handleMouseLeave(event)
        );


        this.canvas.addEventListener(
            "contextmenu",
            event => event.preventDefault()
        );
    }


    /* Convert mouse position to canvas position */

    getMousePosition(event) {

        const rect =
            this.canvas.getBoundingClientRect();


        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }


    /* Mouse down */

    handleMouseDown(event) {

        const position =
            this.getMousePosition(event);


        this.mouseX = position.x;
        this.mouseY = position.y;


        const node =
            this.renderer.getNodeAt(
                position.x,
                position.y
            );


        /*
         * Shift + drag is used for creating edges.
         */
        if (
            event.shiftKey &&
            node
        ) {

            this.isDragging = true;

            this.edgeStartNode = node;

            this.draggedNode = null;

            this.renderer.draw();

            return;
        }


        /*
         * Normal drag moves a node.
         */
        if (node) {

            this.isDragging = true;

            this.draggedNode = node;

            this.dragOffsetX =
                position.x - node.x;

            this.dragOffsetY =
                position.y - node.y;

            return;
        }


        /*
         * Clicking empty space creates a new node.
         */
        this.addNode(
            position.x,
            position.y
        );
    }


    /* Mouse move */

    handleMouseMove(event) {

        const position =
            this.getMousePosition(event);


        this.mouseX = position.x;
        this.mouseY = position.y;


        /*
         * Move a normal node.
         */
        if (
            this.isDragging &&
            this.draggedNode
        ) {

            this.moveNode(
                position.x,
                position.y
            );


            this.renderer.draw();

            return;
        }


        /*
         * Draw temporary edge while Shift + dragging.
         */
        if (
            this.isDragging &&
            this.edgeStartNode
        ) {

            this.renderer.draw();

            this.drawTemporaryEdge(
                this.edgeStartNode,
                position.x,
                position.y
            );
        }
    }


    /* Mouse up */

    handleMouseUp(event) {

        const position =
            this.getMousePosition(event);


        /*
         * Finish edge creation.
         */
        if (
            this.isDragging &&
            this.edgeStartNode
        ) {

            const targetNode =
                this.renderer.getNodeAt(
                    position.x,
                    position.y
                );


            if (
                targetNode &&
                targetNode !== this.edgeStartNode
            ) {

                this.createEdge(
                    this.edgeStartNode,
                    targetNode
                );
            }


            this.edgeStartNode = null;
        }


        this.draggedNode = null;

        this.isDragging = false;

        this.renderer.draw();
    }


    /* Mouse leaves canvas */

    handleMouseLeave() {

        /*
         * Do not immediately cancel a normal node drag.
         * The user may move back into the canvas.
         */
        if (this.edgeStartNode) {

            this.edgeStartNode = null;

            this.isDragging = false;

            this.renderer.draw();
        }
    }


    /* Add a new node */

    addNode(x, y) {

        const radius =
            this.renderer.nodeRadius;

        /*
         * Keep the node completely inside the canvas.
         */
        x = Math.max(
            radius,
            Math.min(
                this.renderer.width - radius,
                x
            )
        );


        y = Math.max(
            radius,
            Math.min(
                this.renderer.height - radius,
                y
            )
        );

        if (this.isNodeTooClose(x, y)) {
            if (typeof this.onMessage === "function"){
                this.onMessage( "Node is too close to another node.");
            }
        return;
        }


        const nodeId =
            this.getNextNodeId();


        const node =
            new Node(
                nodeId,
                x,
                y
            );


        this.graph.addNode(node);


        this.renderer.draw();


        /*
         * Tell UIController that graph changed.
         */
        this.notifyGraphChange();
    }

    isNodeTooClose(x, y) {

    const minimumDistance =
        this.renderer.nodeRadius * 2 + 10;


    for (const node of this.graph.nodes.values()) {

        const dx =
            x - node.x;

        const dy =
            y - node.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (distance < minimumDistance) {
            return true;
        }
    }


    return false;
}


    /* Generate the next node ID */

    getNextNodeId() {

        while (
            this.graph.getNode(
                this.nodeCounter
            )
        ) {

            this.nodeCounter++;
        }


        const id =
            this.nodeCounter;


        this.nodeCounter++;

        return id;
    }


    /* Move a node */

    moveNode(x, y) {

        if (!this.draggedNode) {
            return;
        }


        const radius =
            this.renderer.nodeRadius;


        x -= this.dragOffsetX;
        y -= this.dragOffsetY;


        /*
         * Keep node inside canvas.
         */
        x = Math.max(
            radius,
            Math.min(
                this.renderer.width - radius,
                x
            )
        );


        y = Math.max(
            radius,
            Math.min(
                this.renderer.height - radius,
                y
            )
        );


        this.draggedNode.x = x;
        this.draggedNode.y = y;
    }


    /* Create an edge */

    createEdge(fromNode, toNode) {

        /*
         * Weight comes from the graph/UI setting.
         * UIController can provide the actual value.
         */
        let weight = 1;


        if (this.getWeightedGraph()) {

            weight =
                this.getEdgeWeight();
        }


        const success =
            this.graph.addEdge(
                fromNode.id,
                toNode.id,
                weight
            );


        if (success) {

            this.renderer.draw();

            this.notifyGraphChange();
        }
    }


    /* Draw temporary edge during Shift + drag */

    drawTemporaryEdge(
        node,
        targetX,
        targetY
    ) {

        const dx =
            targetX - node.x;

        const dy =
            targetY - node.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (distance === 0) {
            return;
        }


        const unitX =
            dx / distance;

        const unitY =
            dy / distance;


        const startX =
            node.x +
            unitX *
            this.renderer.nodeRadius;


        const startY =
            node.y +
            unitY *
            this.renderer.nodeRadius;


        this.renderer.ctx.beginPath();

        this.renderer.ctx.moveTo(
            startX,
            startY
        );


        this.renderer.ctx.lineTo(
            targetX,
            targetY
        );


        this.renderer.ctx.setLineDash(
            [6, 6]
        );


        this.renderer.ctx.lineWidth = 2;

        this.renderer.ctx.strokeStyle =
            "#94a3b8";


        this.renderer.ctx.stroke();


        this.renderer.ctx.setLineDash([]);
    }


    /*
     * These functions are kept separate so the controller
     * does not need to know how the UI is structured.
     *
     * UIController can replace them later.
     */

    getWeightedGraph() {

        if (
            typeof this.onGetWeightedGraph ===
            "function"
        ) {

            return this.onGetWeightedGraph();
        }


        return this.graph.weighted;
    }


    getEdgeWeight() {

        if (
            typeof this.onGetEdgeWeight ===
            "function"
        ) {

            return this.onGetEdgeWeight();
        }


        return 1;
    }


    notifyGraphChange() {

        if (
            typeof this.onGraphChange ===
            "function"
        ) {

            this.onGraphChange();
        }
    }


    /* Reset node numbering */

    resetCounter() {

        this.nodeCounter = 1;
    }
}


export { InteractionController };