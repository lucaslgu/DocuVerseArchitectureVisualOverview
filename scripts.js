/**
 * DocuVerse Architecture - Interactive JavaScript
 * Handles theme toggling, D3 visualizations, code tabs, and navigation
 */

(function() {
    'use strict';

    // ===========================================
    // INITIALIZATION
    // ===========================================

    // Track which graphs have been initialized
    const initializedGraphs = new Set();

    document.addEventListener('DOMContentLoaded', () => {
        initMermaid();
        initHighlightJS();
        initNavigation();
        initCodeTabs();
        initBackToTop();
        initDiagramControls();
        initAlgoFlowTabs();
        initAnimations();

        // Lazy load D3 graphs when they become visible
        initLazyLoadGraphs();
    });

    // ===========================================
    // LAZY LOADING FOR D3 GRAPHS
    // ===========================================

    function initLazyLoadGraphs() {
        const graphConfigs = [
            { id: 'architectureGraph', init: initArchitectureGraph },
            { id: 'crawlerGraph', init: initCrawlerGraph },
            { id: 'batchingGraph', init: initBatchingGraph },
            { id: 'ragGraph', init: initRAGGraph },
            { id: 'mindmapGraph', init: initMindmapGraph },
            { id: 'matrixLinkGraph', init: initMatrixLinkGraph },
            { id: 'hnswVisualization', init: initHNSWVisualization }
        ];

        // Add loading placeholders to empty containers
        graphConfigs.forEach(config => {
            const container = document.getElementById(config.id);
            if (container && !container.hasChildNodes()) {
                container.innerHTML = `
                    <div class="graph-loading" style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 300px;
                        color: var(--text-muted, #64748b);
                        font-size: 14px;
                    ">
                        <div style="text-align: center;">
                            <div class="loading-spinner" style="
                                width: 40px;
                                height: 40px;
                                border: 3px solid var(--bg-tertiary, #1e293b);
                                border-top-color: var(--accent, #6366f1);
                                border-radius: 50%;
                                animation: spin 1s linear infinite;
                                margin: 0 auto 12px;
                            "></div>
                            Loading visualization...
                        </div>
                    </div>
                `;
            }
        });

        // Add spinner animation if not exists
        if (!document.getElementById('lazy-load-styles')) {
            const style = document.createElement('style');
            style.id = 'lazy-load-styles';
            style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }

        const observerOptions = {
            root: null,
            rootMargin: '100px', // Start loading slightly before visible
            threshold: 0.1
        };

        const graphObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const graphId = entry.target.id;

                    // Only initialize once
                    if (!initializedGraphs.has(graphId)) {
                        const config = graphConfigs.find(c => c.id === graphId);
                        if (config) {
                            // Use requestIdleCallback for better performance, fallback to setTimeout
                            if ('requestIdleCallback' in window) {
                                requestIdleCallback(() => config.init(), { timeout: 500 });
                            } else {
                                setTimeout(config.init, 100);
                            }
                            initializedGraphs.add(graphId);
                        }
                    }

                    // Stop observing once initialized
                    graphObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe all graph containers
        graphConfigs.forEach(config => {
            const container = document.getElementById(config.id);
            if (container) {
                graphObserver.observe(container);
            }
        });
    }

    // ===========================================
    // MERMAID INITIALIZATION
    // ===========================================

    function initMermaid() {
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: true,
                theme: 'dark',
                themeVariables: {
                    primaryColor: '#6366f1',
                    primaryTextColor: '#fff',
                    primaryBorderColor: '#818cf8',
                    lineColor: '#64748b',
                    secondaryColor: '#1e293b',
                    tertiaryColor: '#0f172a',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                },
                flowchart: {
                    useMaxWidth: true,
                    htmlLabels: true,
                    curve: 'basis'
                },
                mindmap: {
                    useMaxWidth: true,
                    padding: 16
                }
            });
        }
    }

    // ===========================================
    // SYNTAX HIGHLIGHTING
    // ===========================================

    function initHighlightJS() {
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    }

    // ===========================================
    // NAVIGATION & SCROLL SPY
    // ===========================================

    function initNavigation() {
        const nav = document.getElementById('mainNav');
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('section[id], header[id]');

        // Smooth scroll for nav links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);

                if (target) {
                    const navHeight = nav?.offsetHeight || 0;
                    const targetPosition = target.offsetTop - navHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Scroll spy
        let ticking = false;

        function updateActiveNav() {
            const scrollPos = window.scrollY + 100;

            sections.forEach(section => {
                const top = section.offsetTop - 100;
                const bottom = top + section.offsetHeight;
                const id = section.getAttribute('id');

                if (scrollPos >= top && scrollPos < bottom) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });

            // Nav background on scroll
            if (nav) {
                if (window.scrollY > 50) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
            }

            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateActiveNav);
                ticking = true;
            }
        });
    }

    // ===========================================
    // CODE TABS
    // ===========================================

    function initCodeTabs() {
        const tabs = document.querySelectorAll('.code-tab');
        const panels = document.querySelectorAll('.code-panel');

        // Highlight the first active panel on load
        const firstActivePanel = document.querySelector('.code-panel.active');
        if (firstActivePanel && typeof hljs !== 'undefined') {
            firstActivePanel.querySelectorAll('pre code').forEach(block => {
                if (!block.classList.contains('hljs')) {
                    hljs.highlightElement(block);
                }
            });
        }

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetFile = tab.getAttribute('data-file');

                // Update tab states
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update panel states
                panels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.id === `code-${targetFile}`) {
                        panel.classList.add('active');
                    }
                });

                // Re-highlight code in newly visible panel
                const activePanel = document.getElementById(`code-${targetFile}`);
                if (activePanel && typeof hljs !== 'undefined') {
                    activePanel.querySelectorAll('pre code').forEach(block => {
                        if (!block.classList.contains('hljs')) {
                            hljs.highlightElement(block);
                        }
                    });
                }
            });
        });
    }

    // ===========================================
    // ALGORITHM FLOW TABS
    // ===========================================

    function initAlgoFlowTabs() {
        const tabs = document.querySelectorAll('.algo-flow-tab');
        const panels = document.querySelectorAll('.algo-flow-panel');

        if (tabs.length === 0) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetOp = tab.getAttribute('data-op');

                // Update tab states
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update panel states
                panels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.id === `flow-${targetOp}`) {
                        panel.classList.add('active');
                    }
                });

                // Re-highlight code in newly visible panel
                const activePanel = document.getElementById(`flow-${targetOp}`);
                if (activePanel && typeof hljs !== 'undefined') {
                    activePanel.querySelectorAll('pre code').forEach(block => {
                        if (!block.classList.contains('hljs')) {
                            hljs.highlightElement(block);
                        }
                    });
                }
            });
        });
    }

    // ===========================================
    // BACK TO TOP BUTTON
    // ===========================================

    function initBackToTop() {
        const btn = document.getElementById('backToTop');

        if (!btn) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ===========================================
    // DIAGRAM CONTROLS
    // ===========================================

    // ===========================================
    // ARCHITECTURE GRAPH (D3.js)
    // ===========================================

    function initArchitectureGraph() {
        const container = document.getElementById('architectureGraph');
        if (!container || typeof d3 === 'undefined') return;

        const width = container.clientWidth || 900;
        const height = 650;

        // Clear any existing content
        container.innerHTML = '';

        const svg = d3.select('#architectureGraph')
            .append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

        // Define arrow markers for links
        svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path')
            .attr('d', 'M 0,-5 L 10,0 L 0,5')
            .attr('fill', '#64748b');

        // Node data - Architecture components
        const nodes = [
            // Ingestion Layer
            { id: 'seed', label: 'Seed Injector', layer: 'ingestion', sublabel: 'Cron: 02:00 UTC' },
            { id: 'frontier', label: 'Frontier Queue', layer: 'ingestion', sublabel: 'modal.Queue' },
            { id: 'crawler', label: 'Crawler Swarm', layer: 'ingestion', sublabel: '300 containers' },
            { id: 'parser', label: 'HTML Parser', layer: 'ingestion' },
            { id: 'dedup', label: 'Deduplication', layer: 'ingestion', sublabel: 'modal.Dict' },

            // Processing Layer
            { id: 'textq', label: 'Text Queue', layer: 'processing' },
            { id: 'batcher', label: 'Batcher', layer: 'processing', sublabel: 'Batch: 128' },
            { id: 'embedder', label: 'GPU Embedder', layer: 'processing', sublabel: '50x A10G' },
            { id: 'graphbuilder', label: 'Graph Builder', layer: 'processing', sublabel: 'Matrix Link' },

            // Storage Layer
            { id: 's3', label: 'S3 Bucket', layer: 'storage', sublabel: 'Parquet' },
            { id: 'pinecone', label: 'Pinecone', layer: 'storage', sublabel: 'Serverless' },
            { id: 'graphdb', label: 'Graph Store', layer: 'storage', sublabel: 'Authority' },
            { id: 'dlq', label: 'DLQ', layer: 'storage', sublabel: 'Failures' },

            // Interaction Layer
            { id: 'user', label: 'User Query', layer: 'interaction', sublabel: 'Input' },
            { id: 'api', label: 'API Gateway', layer: 'interaction' },
            { id: 'queryembed', label: 'Query Embedder', layer: 'interaction' },
            { id: 'reranker', label: 'Reranker', layer: 'interaction', sublabel: 'Cross-Encoder' },
            { id: 'llm', label: 'GPT-4', layer: 'interaction', sublabel: 'Synthesis' }
        ];

        // Links between components with sequence numbers
        const links = [
            // Ingestion flow
            { source: 'seed', target: 'frontier', seq: 1 },
            { source: 'frontier', target: 'crawler', seq: 2 },
            { source: 'crawler', target: 'parser', seq: 3 },
            { source: 'crawler', target: 'dedup', dashed: true },
            { source: 'crawler', target: 'frontier', dashed: true },

            // Processing flow
            { source: 'parser', target: 'textq', seq: 4 },
            { source: 'textq', target: 'batcher', seq: 5 },
            { source: 'batcher', target: 'embedder', seq: 6 },
            { source: 'parser', target: 'graphbuilder', seq: 4 },

            // Storage flow
            { source: 'embedder', target: 's3', seq: 7 },
            { source: 's3', target: 'pinecone', seq: 8 },
            { source: 'graphbuilder', target: 'graphdb', seq: 5 },
            { source: 'embedder', target: 'dlq', dashed: true },

            // Interaction flow (query path)
            { source: 'user', target: 'api', seq: 'Q1' },
            { source: 'api', target: 'queryembed', seq: 'Q2' },
            { source: 'queryembed', target: 'pinecone', seq: 'Q3' },
            { source: 'pinecone', target: 'reranker', seq: 'Q4' },
            { source: 'graphdb', target: 'reranker', seq: 'Q4', offsetY: -20 },
            { source: 'reranker', target: 'llm', seq: 'Q5' },
            { source: 'llm', target: 'user', seq: 'Q6', offsetY: 5, offsetX: -25 }
        ];

        // Color scale for layers
        const layerColors = {
            'ingestion': '#3b82f6',
            'processing': '#8b5cf6',
            'storage': '#10b981',
            'interaction': '#f59e0b'
        };

        // Y positions for each layer (horizontal layout) - more spread out
        const layerY = {
            'ingestion': height * 0.12,
            'processing': height * 0.37,
            'storage': height * 0.62,
            'interaction': height * 0.87
        };

        // Assign initial positions based on layer with more spread
        nodes.forEach((node, i) => {
            const layerNodes = nodes.filter(n => n.layer === node.layer);
            const indexInLayer = layerNodes.indexOf(node);
            const layerWidth = width / (layerNodes.length + 1);
            node.x = layerWidth * (indexInLayer + 1);
            node.y = layerY[node.layer];
        });

        // Create force simulation with increased spacing
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(140).strength(0.4))
            .force('charge', d3.forceManyBody().strength(-600))
            .force('y', d3.forceY(d => layerY[d.layer]).strength(0.9))
            .force('x', d3.forceX(width / 2).strength(0.03))
            .force('collision', d3.forceCollide().radius(65));

        // Draw links
        const link = svg.append('g')
            .attr('class', 'arch-links')
            .selectAll('path')
            .data(links)
            .join('path')
            .attr('class', 'arch-link')
            .attr('fill', 'none')
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', d => d.dashed ? '5,5' : 'none')
            .attr('marker-end', 'url(#arrowhead)')
            .attr('opacity', 0.6);

        // Draw sequence number badges on links
        const seqLabels = svg.append('g')
            .attr('class', 'arch-seq-labels')
            .selectAll('g')
            .data(links.filter(l => l.seq))
            .join('g')
            .attr('class', 'arch-seq-label');

        // Badge circle background
        seqLabels.append('circle')
            .attr('r', 10)
            .attr('fill', '#1e293b')
            .attr('stroke', '#64748b')
            .attr('stroke-width', 1.5);

        // Badge text
        seqLabels.append('text')
            .text(d => d.seq)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', '#f8fafc')
            .attr('font-size', '9px')
            .attr('font-weight', '700')
            .attr('font-family', 'JetBrains Mono, monospace');

        // Draw nodes
        const node = svg.append('g')
            .attr('class', 'arch-nodes')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .attr('class', 'arch-node')
            .call(drag(simulation));

        // Node background rectangles
        node.append('rect')
            .attr('width', 100)
            .attr('height', d => d.sublabel ? 45 : 35)
            .attr('x', -50)
            .attr('y', d => d.sublabel ? -22.5 : -17.5)
            .attr('rx', 8)
            .attr('fill', d => layerColors[d.layer])
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('cursor', 'grab')
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('stroke-width', 4)
                    .attr('filter', 'brightness(1.2)');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('stroke-width', 2)
                    .attr('filter', 'none');
            });

        // Node labels
        node.append('text')
            .text(d => d.label)
            .attr('text-anchor', 'middle')
            .attr('y', d => d.sublabel ? -3 : 5)
            .attr('fill', '#fff')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .attr('font-family', 'Inter, sans-serif')
            .attr('pointer-events', 'none');

        // Sublabels
        node.filter(d => d.sublabel)
            .append('text')
            .text(d => d.sublabel)
            .attr('text-anchor', 'middle')
            .attr('y', 12)
            .attr('fill', 'rgba(255,255,255,0.8)')
            .attr('font-size', '9px')
            .attr('font-family', 'Inter, sans-serif')
            .attr('pointer-events', 'none');

        // Update positions on tick
        simulation.on('tick', () => {
            // Update link paths with curves
            link.attr('d', d => {
                // Straight line for most, curve for feedback loops
                if (d.dashed) {
                    return `M${d.source.x},${d.source.y} Q${(d.source.x + d.target.x) / 2 + 30},${(d.source.y + d.target.y) / 2} ${d.target.x},${d.target.y}`;
                }
                return `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`;
            });

            // Update sequence label positions (at midpoint of each link with optional offset)
            seqLabels.attr('transform', d => {
                const midX = (d.source.x + d.target.x) / 2 + (d.offsetX || 0);
                const midY = (d.source.y + d.target.y) / 2 + (d.offsetY || 0);
                return `translate(${midX},${midY})`;
            });

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Store reference for filtering
        window.archGraphSvg = svg;
    }

    // Filter architecture graph by layer
    function filterArchitectureGraph(layer) {
        const svg = window.archGraphSvg;
        if (!svg) return;

        if (layer === 'full') {
            // Show all nodes and links at full opacity
            svg.selectAll('.arch-node')
                .transition()
                .duration(300)
                .attr('opacity', 1);
            svg.selectAll('.arch-link')
                .transition()
                .duration(300)
                .attr('opacity', 0.6);
        } else {
            // Dim non-matching nodes, highlight matching
            svg.selectAll('.arch-node')
                .transition()
                .duration(300)
                .attr('opacity', d => d.layer === layer ? 1 : 0.15);
            svg.selectAll('.arch-link')
                .transition()
                .duration(300)
                .attr('opacity', d =>
                    d.source.layer === layer || d.target.layer === layer ? 0.8 : 0.08);
        }
    }

    // Crawler Graph - Producer-Consumer Pattern Visualization
    function initCrawlerGraph() {
        const container = document.getElementById('crawlerGraph');
        if (!container) return;

        container.innerHTML = '';

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 400;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

        // Define arrow markers
        const defs = svg.append('defs');

        const markerColors = {
            'producer': '#f59e0b',
            'queue': '#3b82f6',
            'worker': '#10b981',
            'state': '#8b5cf6'
        };

        Object.entries(markerColors).forEach(([key, color]) => {
            defs.append('marker')
                .attr('id', `arrow-crawler-${key}`)
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 20)
                .attr('refY', 0)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', color);
        });

        // Nodes data
        const nodes = [
            { id: 'seed', label: 'Seed Injector', sublabel: 'Cron: 02:00 UTC', type: 'producer', x: 100, y: height / 2 },
            { id: 'queue', label: 'Frontier Queue', sublabel: 'modal.Queue', type: 'queue', x: 280, y: height / 2 },
            { id: 'worker1', label: 'Worker 1', sublabel: 'Container', type: 'worker', x: 480, y: height / 2 - 100 },
            { id: 'worker2', label: 'Worker 2', sublabel: 'Container', type: 'worker', x: 480, y: height / 2 },
            { id: 'workerN', label: 'Worker N', sublabel: '...300 total', type: 'worker', x: 480, y: height / 2 + 100 },
            { id: 'visited', label: 'Visited Dict', sublabel: 'modal.Dict', type: 'state', x: 700, y: height / 2 }
        ];

        // Links data
        const links = [
            { source: 'seed', target: 'queue', label: 'Push URLs', type: 'producer' },
            { source: 'queue', target: 'worker1', label: 'Pop', type: 'queue' },
            { source: 'queue', target: 'worker2', label: 'Pop', type: 'queue' },
            { source: 'queue', target: 'workerN', label: 'Pop', type: 'queue' },
            { source: 'worker1', target: 'visited', label: 'Check/Mark', type: 'worker' },
            { source: 'worker2', target: 'visited', label: 'Check/Mark', type: 'worker' },
            { source: 'workerN', target: 'visited', label: 'Check/Mark', type: 'worker' },
            { source: 'worker1', target: 'queue', label: 'New links', type: 'worker', curved: true },
            { source: 'worker2', target: 'queue', label: '', type: 'worker', curved: true },
            { source: 'workerN', target: 'queue', label: '', type: 'worker', curved: true }
        ];

        // Create node map for link references
        const nodeMap = {};
        nodes.forEach(n => nodeMap[n.id] = n);

        // Draw links
        const linkGroup = svg.append('g').attr('class', 'crawler-links');

        links.forEach(link => {
            const source = nodeMap[link.source];
            const target = nodeMap[link.target];
            const color = markerColors[link.type];

            if (link.curved) {
                // Curved path for feedback loops (worker -> queue)
                const midX = (source.x + target.x) / 2;
                const midY = Math.min(source.y, target.y) - 60;

                linkGroup.append('path')
                    .attr('class', 'crawler-link')
                    .attr('d', `M${source.x},${source.y} Q${midX},${midY} ${target.x + 40},${target.y - 20}`)
                    .attr('fill', 'none')
                    .attr('stroke', color)
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '5,3')
                    .attr('opacity', 0.7)
                    .attr('marker-end', `url(#arrow-crawler-${link.type})`);
            } else {
                linkGroup.append('line')
                    .attr('class', 'crawler-link')
                    .attr('x1', source.x + 40)
                    .attr('y1', source.y)
                    .attr('x2', target.x - 40)
                    .attr('y2', target.y)
                    .attr('stroke', color)
                    .attr('stroke-width', 2)
                    .attr('opacity', 0.7)
                    .attr('marker-end', `url(#arrow-crawler-${link.type})`);

                // Add link label
                if (link.label) {
                    const labelX = (source.x + target.x) / 2;
                    const labelY = (source.y + target.y) / 2 - 8;

                    linkGroup.append('text')
                        .attr('x', labelX)
                        .attr('y', labelY)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '10px')
                        .attr('fill', 'var(--text-muted)')
                        .text(link.label);
                }
            }
        });

        // Draw nodes
        const nodeGroup = svg.append('g').attr('class', 'crawler-nodes');

        nodes.forEach(node => {
            const g = nodeGroup.append('g')
                .attr('class', 'crawler-node')
                .attr('transform', `translate(${node.x}, ${node.y})`)
                .style('cursor', 'pointer');

            // Node background
            g.append('rect')
                .attr('x', -50)
                .attr('y', -25)
                .attr('width', 100)
                .attr('height', 50)
                .attr('rx', 8)
                .attr('fill', markerColors[node.type])
                .attr('opacity', 0.15)
                .attr('stroke', markerColors[node.type])
                .attr('stroke-width', 2);

            // Node label
            g.append('text')
                .attr('y', -5)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('font-weight', '600')
                .attr('fill', markerColors[node.type])
                .text(node.label);

            // Node sublabel
            g.append('text')
                .attr('y', 12)
                .attr('text-anchor', 'middle')
                .attr('font-size', '9px')
                .attr('fill', 'var(--text-muted)')
                .text(node.sublabel);

            // Hover effects
            g.on('mouseover', function() {
                d3.select(this).select('rect')
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.3)
                    .attr('stroke-width', 3);
            })
            .on('mouseout', function() {
                d3.select(this).select('rect')
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.15)
                    .attr('stroke-width', 2);
            });
        });

        // Animate data flow particles
        function animateParticles() {
            links.filter(l => !l.curved).forEach((link, i) => {
                const source = nodeMap[link.source];
                const target = nodeMap[link.target];
                const color = markerColors[link.type];

                setTimeout(() => {
                    const particle = svg.append('circle')
                        .attr('r', 4)
                        .attr('fill', color)
                        .attr('cx', source.x + 40)
                        .attr('cy', source.y);

                    particle.transition()
                        .duration(1500)
                        .ease(d3.easeLinear)
                        .attr('cx', target.x - 40)
                        .attr('cy', target.y)
                        .remove();
                }, i * 300);
            });
        }

        // Run particle animation periodically
        animateParticles();
        setInterval(animateParticles, 4000);
    }

    // Batching Graph - GPU Throughput Visualization
    function initBatchingGraph() {
        const container = document.getElementById('batchingGraph');
        if (!container) return;

        container.innerHTML = '';

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 350;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

        // Define arrow markers
        const defs = svg.append('defs');

        const markerColors = {
            'input': '#3b82f6',
            'batcher': '#f59e0b',
            'gpu': '#8b5cf6'
        };

        Object.entries(markerColors).forEach(([key, color]) => {
            defs.append('marker')
                .attr('id', `arrow-batch-${key}`)
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 20)
                .attr('refY', 0)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', color);
        });

        // Nodes data
        const nodes = [
            // Input layer (Crawlers)
            { id: 'crawler1', label: 'Crawler 1', sublabel: 'Text chunks', type: 'input', x: 80, y: height * 0.2 },
            { id: 'crawler2', label: 'Crawler 2', sublabel: 'Text chunks', type: 'input', x: 80, y: height * 0.5 },
            { id: 'crawlerN', label: 'Crawler N', sublabel: '...', type: 'input', x: 80, y: height * 0.8 },
            // Batcher layer
            { id: 'queue', label: 'Queue', sublabel: 'FIFO', type: 'batcher', x: 280, y: height * 0.5 },
            { id: 'accumulator', label: 'Accumulator', sublabel: 'batch=128 | 500ms', type: 'batcher', x: 480, y: height * 0.5 },
            // GPU layer
            { id: 'embedder', label: 'GPU Embedder', sublabel: 'Matrix Multiply', type: 'gpu', x: 700, y: height * 0.5 }
        ];

        // Links data
        const links = [
            { source: 'crawler1', target: 'queue', type: 'input' },
            { source: 'crawler2', target: 'queue', type: 'input' },
            { source: 'crawlerN', target: 'queue', type: 'input' },
            { source: 'queue', target: 'accumulator', type: 'batcher', label: 'Stream' },
            { source: 'accumulator', target: 'embedder', type: 'gpu', label: 'Batch of 128' }
        ];

        // Create node map for link references
        const nodeMap = {};
        nodes.forEach(n => nodeMap[n.id] = n);

        // Draw background regions for each stage
        const stages = [
            { x: 20, y: 20, w: 160, h: height - 40, label: 'INPUT', color: 'rgba(59, 130, 246, 0.08)', border: '#3b82f6' },
            { x: 200, y: 20, w: 360, h: height - 40, label: 'BATCHER (CPU)', color: 'rgba(245, 158, 11, 0.08)', border: '#f59e0b' },
            { x: 580, y: 20, w: width - 600, h: height - 40, label: 'GPU', color: 'rgba(139, 92, 246, 0.08)', border: '#8b5cf6' }
        ];

        stages.forEach(stage => {
            svg.append('rect')
                .attr('x', stage.x)
                .attr('y', stage.y)
                .attr('width', stage.w)
                .attr('height', stage.h)
                .attr('rx', 12)
                .attr('fill', stage.color)
                .attr('stroke', stage.border)
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '4,4');

            svg.append('text')
                .attr('x', stage.x + 10)
                .attr('y', stage.y + 20)
                .attr('font-size', '10px')
                .attr('font-weight', '700')
                .attr('fill', stage.border)
                .attr('opacity', 0.8)
                .text(stage.label);
        });

        // Draw links
        const linkGroup = svg.append('g').attr('class', 'batch-links');

        links.forEach(link => {
            const source = nodeMap[link.source];
            const target = nodeMap[link.target];
            const color = markerColors[link.type];

            linkGroup.append('line')
                .attr('class', 'batch-link')
                .attr('x1', source.x + 50)
                .attr('y1', source.y)
                .attr('x2', target.x - 50)
                .attr('y2', target.y)
                .attr('stroke', color)
                .attr('stroke-width', 2)
                .attr('opacity', 0.7)
                .attr('marker-end', `url(#arrow-batch-${link.type})`);

            // Add link label
            if (link.label) {
                const labelX = (source.x + target.x) / 2;
                const labelY = (source.y + target.y) / 2 - 10;

                linkGroup.append('text')
                    .attr('x', labelX)
                    .attr('y', labelY)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '10px')
                    .attr('font-weight', '600')
                    .attr('fill', color)
                    .text(link.label);
            }
        });

        // Draw nodes
        const nodeGroup = svg.append('g').attr('class', 'batch-nodes');

        nodes.forEach(node => {
            const g = nodeGroup.append('g')
                .attr('class', 'batch-node')
                .attr('transform', `translate(${node.x}, ${node.y})`)
                .style('cursor', 'pointer');

            // Node background
            g.append('rect')
                .attr('x', -50)
                .attr('y', -28)
                .attr('width', 100)
                .attr('height', 56)
                .attr('rx', 10)
                .attr('fill', markerColors[node.type])
                .attr('opacity', 0.2)
                .attr('stroke', markerColors[node.type])
                .attr('stroke-width', 2);

            // Node label
            g.append('text')
                .attr('y', -5)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .attr('font-weight', '600')
                .attr('fill', markerColors[node.type])
                .text(node.label);

            // Node sublabel
            g.append('text')
                .attr('y', 12)
                .attr('text-anchor', 'middle')
                .attr('font-size', '9px')
                .attr('fill', 'var(--text-muted)')
                .text(node.sublabel);

            // Hover effects
            g.on('mouseover', function() {
                d3.select(this).select('rect')
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.4)
                    .attr('stroke-width', 3);
            })
            .on('mouseout', function() {
                d3.select(this).select('rect')
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.2)
                    .attr('stroke-width', 2);
            });
        });

        // Animate data flow particles
        function animateBatchParticles() {
            links.forEach((link, i) => {
                const source = nodeMap[link.source];
                const target = nodeMap[link.target];
                const color = markerColors[link.type];

                setTimeout(() => {
                    const particle = svg.append('circle')
                        .attr('r', link.type === 'gpu' ? 6 : 4)
                        .attr('fill', color)
                        .attr('cx', source.x + 50)
                        .attr('cy', source.y);

                    particle.transition()
                        .duration(1200)
                        .ease(d3.easeLinear)
                        .attr('cx', target.x - 50)
                        .attr('cy', target.y)
                        .remove();
                }, i * 200);
            });
        }

        // Run particle animation periodically
        animateBatchParticles();
        setInterval(animateBatchParticles, 3500);
    }

    // ===========================================
    // RAG PIPELINE GRAPH (D3.js)
    // ===========================================

    function initRAGGraph() {
        const container = document.getElementById('ragGraph');
        if (!container || typeof d3 === 'undefined') return;

        // Clear any existing content
        container.innerHTML = '';

        const width = container.clientWidth || 800;
        const height = 380;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Stage colors
        const stageColors = {
            query: '#3b82f6',
            retrieval: '#10b981',
            ranking: '#f59e0b',
            synthesis: '#8b5cf6'
        };

        // Define nodes for RAG pipeline
        const nodes = [
            { id: 'user', label: 'User Query', sublabel: '"How do I mount a volume?"', stage: 'query' },
            { id: 'queryEmbed', label: 'Query Embedder', sublabel: 'e5-large model', stage: 'query' },
            { id: 'pinecone', label: 'Pinecone', sublabel: 'Vector + BM25', stage: 'retrieval' },
            { id: 'filter', label: 'Filter', sublabel: 'metadata.updated > 1yr', stage: 'retrieval' },
            { id: 'crossEncoder', label: 'Cross-Encoder', sublabel: 'Precision boost', stage: 'ranking' },
            { id: 'matrixBoost', label: 'Matrix Boost', sublabel: 'Authority score', stage: 'ranking' },
            { id: 'llm', label: 'GPT-4', sublabel: 'Generate answer', stage: 'synthesis' },
            { id: 'answer', label: 'Answer', sublabel: 'Final response', stage: 'synthesis' }
        ];

        // Define links with flow labels
        const links = [
            { source: 'user', target: 'queryEmbed', label: '' },
            { source: 'queryEmbed', target: 'pinecone', label: 'Query vector' },
            { source: 'pinecone', target: 'filter', label: 'Top 50' },
            { source: 'filter', target: 'crossEncoder', label: '' },
            { source: 'crossEncoder', target: 'matrixBoost', label: '' },
            { source: 'matrixBoost', target: 'llm', label: 'Top 5 chunks' },
            { source: 'llm', target: 'answer', label: '' }
        ];

        // Stage positions (horizontal layout)
        const stageX = {
            query: width * 0.1,
            retrieval: width * 0.35,
            ranking: width * 0.6,
            synthesis: width * 0.85
        };

        // Position nodes
        const nodePositions = {
            user: { x: stageX.query, y: height * 0.35 },
            queryEmbed: { x: stageX.query, y: height * 0.65 },
            pinecone: { x: stageX.retrieval, y: height * 0.35 },
            filter: { x: stageX.retrieval, y: height * 0.65 },
            crossEncoder: { x: stageX.ranking, y: height * 0.35 },
            matrixBoost: { x: stageX.ranking, y: height * 0.65 },
            llm: { x: stageX.synthesis, y: height * 0.35 },
            answer: { x: stageX.synthesis, y: height * 0.65 }
        };

        // Add node positions to data
        nodes.forEach(n => {
            n.x = nodePositions[n.id].x;
            n.y = nodePositions[n.id].y;
        });

        // Draw stage backgrounds
        const stages = [
            { id: 'query', label: '1. Query Processing', x: width * 0.02, width: width * 0.18 },
            { id: 'retrieval', label: '2. Hybrid Retrieval', x: width * 0.22, width: width * 0.22 },
            { id: 'ranking', label: '3. Re-Ranking', x: width * 0.46, width: width * 0.22 },
            { id: 'synthesis', label: '4. Synthesis', x: width * 0.70, width: width * 0.28 }
        ];

        const stageGroups = svg.selectAll('.stage-bg')
            .data(stages)
            .enter()
            .append('g')
            .attr('class', 'stage-bg');

        stageGroups.append('rect')
            .attr('x', d => d.x)
            .attr('y', 40)
            .attr('width', d => d.width)
            .attr('height', height - 60)
            .attr('rx', 12)
            .attr('fill', d => stageColors[d.id])
            .attr('fill-opacity', 0.1)
            .attr('stroke', d => stageColors[d.id])
            .attr('stroke-opacity', 0.3);

        stageGroups.append('text')
            .attr('x', d => d.x + d.width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .attr('fill', d => stageColors[d.id])
            .attr('font-size', '12px')
            .attr('font-weight', '600')
            .text(d => d.label);

        // Create link generator
        const linkGen = d3.linkHorizontal()
            .x(d => d.x)
            .y(d => d.y);

        // Draw links
        const linkGroup = svg.append('g').attr('class', 'links');

        links.forEach(link => {
            const sourceNode = nodes.find(n => n.id === link.source);
            const targetNode = nodes.find(n => n.id === link.target);

            // Calculate link path
            const sourceX = sourceNode.x + 60;
            const sourceY = sourceNode.y;
            const targetX = targetNode.x - 60;
            const targetY = targetNode.y;

            // Draw curved path
            const path = linkGroup.append('path')
                .attr('d', `M${sourceX},${sourceY} C${sourceX + 40},${sourceY} ${targetX - 40},${targetY} ${targetX},${targetY}`)
                .attr('fill', 'none')
                .attr('stroke', '#64748b')
                .attr('stroke-width', 2)
                .attr('stroke-opacity', 0.6)
                .attr('marker-end', 'url(#rag-arrow)');

            // Add link label if exists
            if (link.label) {
                const midX = (sourceX + targetX) / 2;
                const midY = (sourceY + targetY) / 2 - 12;

                linkGroup.append('text')
                    .attr('x', midX)
                    .attr('y', midY)
                    .attr('text-anchor', 'middle')
                    .attr('fill', '#94a3b8')
                    .attr('font-size', '10px')
                    .text(link.label);
            }
        });

        // Add arrow marker
        svg.append('defs')
            .append('marker')
            .attr('id', 'rag-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#64748b');

        // Draw nodes
        const nodeGroup = svg.selectAll('.rag-node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'rag-node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`);

        // Node rectangles
        nodeGroup.append('rect')
            .attr('x', -55)
            .attr('y', -28)
            .attr('width', 110)
            .attr('height', 56)
            .attr('rx', 8)
            .attr('fill', d => {
                const color = stageColors[d.stage];
                return color + '20';
            })
            .attr('stroke', d => stageColors[d.stage])
            .attr('stroke-width', 2);

        // Node main labels
        nodeGroup.append('text')
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .attr('fill', d => stageColors[d.stage])
            .attr('font-size', '12px')
            .attr('font-weight', '600')
            .text(d => d.label);

        // Node sublabels
        nodeGroup.append('text')
            .attr('y', 12)
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8')
            .attr('font-size', '9px')
            .text(d => d.sublabel);

        // Animate particles along the path
        function animateRAGParticles() {
            const particleData = [
                { from: 'user', to: 'queryEmbed', delay: 0 },
                { from: 'queryEmbed', to: 'pinecone', delay: 400 },
                { from: 'pinecone', to: 'filter', delay: 800 },
                { from: 'filter', to: 'crossEncoder', delay: 1200 },
                { from: 'crossEncoder', to: 'matrixBoost', delay: 1600 },
                { from: 'matrixBoost', to: 'llm', delay: 2000 },
                { from: 'llm', to: 'answer', delay: 2400 }
            ];

            particleData.forEach((p, i) => {
                setTimeout(() => {
                    const source = nodes.find(n => n.id === p.from);
                    const target = nodes.find(n => n.id === p.to);

                    const particle = svg.append('circle')
                        .attr('r', 4)
                        .attr('fill', stageColors[source.stage])
                        .attr('cx', source.x + 55)
                        .attr('cy', source.y);

                    particle.transition()
                        .duration(800)
                        .ease(d3.easeLinear)
                        .attr('cx', target.x - 55)
                        .attr('cy', target.y)
                        .remove();
                }, p.delay);
            });
        }

        // Run particle animation periodically
        animateRAGParticles();
        setInterval(animateRAGParticles, 4000);
    }

    // ===========================================
    // MIND MAP GRAPH (D3.js)
    // ===========================================

    function initMindmapGraph() {
        const container = document.getElementById('mindmapGraph');
        if (!container || typeof d3 === 'undefined') return;

        container.innerHTML = '';

        const width = container.clientWidth || 900;
        const height = 600;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Category colors
        const categoryColors = {
            root: '#6366f1',
            Ingestion: '#3b82f6',
            Processing: '#8b5cf6',
            Memory: '#10b981',
            Interaction: '#f59e0b'
        };

        // Mind map data structure
        const mindmapData = {
            name: 'DocuVerse Engine',
            category: 'root',
            children: [
                {
                    name: 'Ingestion',
                    category: 'Ingestion',
                    children: [
                        { name: 'Crawler Swarm', sublabels: ['Politeness Sharding', 'Per-domain limits', 'robots.txt respect'] },
                        { name: 'Deduplication', sublabels: ['modal.Dict', 'URL normalization', 'Content hashing'] },
                        { name: 'Frontier Queue', sublabels: ['modal.Queue', 'Dynamic expansion', 'Priority scoring'] },
                        { name: 'Seed Injector', sublabels: ['Cron scheduled', 'Root URL mgmt', 'Budget guards'] }
                    ]
                },
                {
                    name: 'Processing',
                    category: 'Processing',
                    children: [
                        { name: 'HTML Parser', sublabels: ['BeautifulSoup', 'Content extraction', 'Metadata capture'] },
                        { name: 'Graph Builder', sublabels: ['Matrix Link', 'Adjacency matrix', 'Authority scores'] },
                        { name: 'Batcher', sublabels: ['Batch size: 128', 'Timeout: 500ms', 'Queue coordination'] },
                        { name: 'Embedder', sublabels: ['e5-large', 'GPU: A10G x50', '8-bit quant'] }
                    ]
                },
                {
                    name: 'Memory',
                    category: 'Memory',
                    children: [
                        { name: 'Pinecone', sublabels: ['Hybrid search', 'S3 bulk import', 'Auto-scaling'] },
                        { name: 'S3 Bucket', sublabels: ['Parquet storage', 'Async ingestion', 'Cost-effective'] },
                        { name: 'Graph Store', sublabels: ['PageRank scores', 'Link relationships', 'Authority'] },
                        { name: 'DLQ Handler', sublabels: ['Error capture', 'Retry logic', 'Alerting'] }
                    ]
                },
                {
                    name: 'Interaction',
                    category: 'Interaction',
                    children: [
                        { name: 'API Endpoint', sublabels: ['Query validation', 'Rate limiting', 'Caching'] },
                        { name: 'LangChain', sublabels: ['Chain composition', 'Memory mgmt', 'Tool integration'] },
                        { name: 'RAG Pipeline', sublabels: ['Retrieval', 'Re-ranking', 'Synthesis'] },
                        { name: 'Cross-Encoder', sublabels: ['Precision boost', 'GPU inference', 'Top-K selection'] }
                    ]
                }
            ]
        };

        // Create hierarchy
        const root = d3.hierarchy(mindmapData);

        // Use cluster layout for radial tree
        const radius = Math.min(width, height) / 2 - 80;

        const tree = d3.tree()
            .size([2 * Math.PI, radius])
            .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

        tree(root);

        // Center the visualization
        const g = svg.append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Draw links
        g.selectAll('.mindmap-link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'mindmap-link')
            .attr('fill', 'none')
            .attr('stroke', d => {
                const category = d.target.data.category || d.source.data.category || d.source.data.name;
                return categoryColors[category] || '#64748b';
            })
            .attr('stroke-opacity', 0.5)
            .attr('stroke-width', d => Math.max(1, 3 - d.target.depth))
            .attr('d', d3.linkRadial()
                .angle(d => d.x)
                .radius(d => d.y));

        // Draw nodes
        const nodes = g.selectAll('.mindmap-node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'mindmap-node')
            .attr('transform', d => {
                // Root node stays at center without rotation
                if (d.depth === 0) return 'translate(0, 0)';
                return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y}, 0)`;
            });

        // Root node (center)
        nodes.filter(d => d.depth === 0)
            .append('circle')
            .attr('r', 55)
            .attr('fill', categoryColors.root)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        nodes.filter(d => d.depth === 0)
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.2em')
            .attr('fill', '#fff')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .text('DocuVerse');

        nodes.filter(d => d.depth === 0)
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1em')
            .attr('fill', '#fff')
            .attr('font-size', '10px')
            .text('Engine');

        // Category nodes (level 1)
        nodes.filter(d => d.depth === 1)
            .append('circle')
            .attr('r', 38)
            .attr('fill', d => categoryColors[d.data.name] + '30')
            .attr('stroke', d => categoryColors[d.data.name])
            .attr('stroke-width', 2);

        nodes.filter(d => d.depth === 1)
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', d => categoryColors[d.data.name])
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
            .text(d => d.data.name);

        // Component nodes (level 2)
        nodes.filter(d => d.depth === 2)
            .append('circle')
            .attr('r', 32)
            .attr('fill', d => {
                const category = d.parent.data.name;
                return categoryColors[category] + '20';
            })
            .attr('stroke', d => {
                const category = d.parent.data.name;
                return categoryColors[category];
            })
            .attr('stroke-width', 1.5);

        nodes.filter(d => d.depth === 2)
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', d => {
                const category = d.parent.data.name;
                return categoryColors[category];
            })
            .attr('font-size', '9px')
            .attr('font-weight', '500')
            .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
            .text(d => d.data.name);

        // Add tooltips for level 2 nodes showing sublabels
        nodes.filter(d => d.depth === 2)
            .append('title')
            .text(d => d.data.sublabels ? d.data.sublabels.join('\n') : '');

        // Add hover interaction
        nodes.on('mouseover', function(event, d) {
            const node = d3.select(this);

            // Scale up the node using base transform (prevents exponential growth on repeated hovers)
            const baseTransform = d.depth === 0
                ? 'translate(0, 0)'
                : `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y}, 0)`;
            node.transition()
                .duration(200)
                .attr('transform', baseTransform + ' scale(1.15)');

            // Rotate text to horizontal for readability (counter-rotate)
            if (d.depth > 0) {
                const rotation = d.x * 180 / Math.PI - 90;
                node.selectAll('text')
                    .transition()
                    .duration(200)
                    .attr('transform', `rotate(${-rotation})`);
            }

            // Dim other nodes for focus effect
            g.selectAll('.mindmap-node')
                .filter(n => n !== d)
                .transition()
                .duration(200)
                .attr('opacity', 0.3);

            // Highlight connected links
            g.selectAll('.mindmap-link')
                .transition()
                .duration(200)
                .attr('stroke-opacity', l =>
                    (l.source === d || l.target === d) ? 0.8 : 0.1
                );
        })
        .on('mouseout', function(event, d) {
            const node = d3.select(this);

            // Reset transform (remove scale)
            const baseTransform = d.depth === 0
                ? 'translate(0, 0)'
                : `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y}, 0)`;
            node.transition()
                .duration(200)
                .attr('transform', baseTransform);

            // Reset text rotation
            if (d.depth === 1 || d.depth === 2) {
                node.selectAll('text')
                    .transition()
                    .duration(200)
                    .attr('transform', d.x >= Math.PI ? 'rotate(180)' : null);
            }

            // Reset all nodes opacity
            g.selectAll('.mindmap-node')
                .transition()
                .duration(200)
                .attr('opacity', 1);

            // Reset all links opacity
            g.selectAll('.mindmap-link')
                .transition()
                .duration(200)
                .attr('stroke-opacity', 0.5);
        });

        // Add subtle pulse animation to root
        svg.select('.mindmap-node circle')
            .style('animation', 'pulse 2s ease-in-out infinite');
    }

    function initDiagramControls() {
        const controls = document.querySelectorAll('.diagram-btn');

        controls.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');

                controls.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Filter the D3 architecture graph
                filterArchitectureGraph(view);

                // Highlight relevant architecture cards
                const cards = document.querySelectorAll('.arch-card');
                cards.forEach(card => {
                    const layer = card.getAttribute('data-layer');

                    if (view === 'full') {
                        card.classList.remove('dimmed');
                        card.classList.remove('highlighted');
                    } else if (layer === view) {
                        card.classList.remove('dimmed');
                        card.classList.add('highlighted');
                    } else {
                        card.classList.add('dimmed');
                        card.classList.remove('highlighted');
                    }
                });
            });
        });
    }

    // ===========================================
    // MATRIX LINK GRAPH (D3.js)
    // ===========================================

    function initMatrixLinkGraph() {
        const container = document.getElementById('matrixLinkGraph');
        if (!container || typeof d3 === 'undefined') return;

        const width = container.clientWidth || 500;
        const height = 350;

        // Clear any existing content
        container.innerHTML = '';

        const svg = d3.select('#matrixLinkGraph')
            .append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

        // Node data representing documentation pages
        const nodes = [
            { id: 'react-docs', label: 'React Docs', group: 'official', size: 28 },
            { id: 'useEffect', label: 'useEffect', group: 'api', size: 24 },
            { id: 'useState', label: 'useState', group: 'api', size: 22 },
            { id: 'blog-1', label: 'Blog Post 1', group: 'community', size: 14 },
            { id: 'blog-2', label: 'Blog Post 2', group: 'community', size: 12 },
            { id: 'so-answer', label: 'SO Answer', group: 'community', size: 18 },
            { id: 'tutorial', label: 'Tutorial', group: 'community', size: 16 },
            { id: 'hooks-intro', label: 'Hooks Intro', group: 'official', size: 20 }
        ];

        // Links representing references between pages
        const links = [
            { source: 'react-docs', target: 'useEffect', weight: 5 },
            { source: 'react-docs', target: 'useState', weight: 5 },
            { source: 'react-docs', target: 'hooks-intro', weight: 4 },
            { source: 'hooks-intro', target: 'useEffect', weight: 3 },
            { source: 'hooks-intro', target: 'useState', weight: 3 },
            { source: 'blog-1', target: 'useEffect', weight: 2 },
            { source: 'blog-2', target: 'useEffect', weight: 2 },
            { source: 'so-answer', target: 'useEffect', weight: 3 },
            { source: 'tutorial', target: 'useState', weight: 2 },
            { source: 'tutorial', target: 'useEffect', weight: 2 },
            { source: 'blog-1', target: 'hooks-intro', weight: 1 }
        ];

        // Color scale for node groups
        const colorScale = d3.scaleOrdinal()
            .domain(['official', 'api', 'community'])
            .range(['#10b981', '#6366f1', '#f59e0b']);

        // Create force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(80))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => d.size + 10));

        // Draw links
        const link = svg.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', '#64748b')
            .attr('stroke-width', d => Math.sqrt(d.weight))
            .attr('stroke-opacity', 0.6);

        // Draw nodes
        const node = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .call(drag(simulation));

        // Node circles
        node.append('circle')
            .attr('r', d => d.size)
            .attr('fill', d => colorScale(d.group))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('cursor', 'grab')
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('stroke-width', 4);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('stroke-width', 2);
            });

        // Node labels
        node.append('text')
            .text(d => d.label)
            .attr('x', 0)
            .attr('y', d => d.size + 14)
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8')
            .attr('font-size', '11px')
            .attr('font-family', 'Inter, sans-serif');

        // Update positions on tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Add legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(20, 20)`);

        const legendData = [
            { label: 'Official Docs', color: '#10b981' },
            { label: 'API Reference', color: '#6366f1' },
            { label: 'Community', color: '#f59e0b' }
        ];

        legendData.forEach((item, i) => {
            const g = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);

            g.append('circle')
                .attr('r', 6)
                .attr('fill', item.color);

            g.append('text')
                .text(item.label)
                .attr('x', 12)
                .attr('y', 4)
                .attr('fill', '#94a3b8')
                .attr('font-size', '11px');
        });
    }

    // ===========================================
    // HNSW VISUALIZATION (D3.js)
    // ===========================================

    function initHNSWVisualization() {
        const container = document.getElementById('hnswVisualization');
        if (!container || typeof d3 === 'undefined') return;

        const width = container.clientWidth || 700;
        const height = 400;

        // Clear any existing content
        container.innerHTML = '';

        const svg = d3.select('#hnswVisualization')
            .append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

        // HNSW layer data
        const layers = [
            { level: 2, label: 'Layer 2 (Top)', y: 50, nodes: 3, color: '#ef4444' },
            { level: 1, label: 'Layer 1', y: 160, nodes: 8, color: '#f59e0b' },
            { level: 0, label: 'Layer 0 (Base)', y: 280, nodes: 20, color: '#6366f1' }
        ];

        // Generate nodes for each layer
        const allNodes = [];
        const layerConnections = [];

        layers.forEach(layer => {
            const nodeSpacing = (width - 100) / (layer.nodes + 1);
            for (let i = 0; i < layer.nodes; i++) {
                const node = {
                    id: `L${layer.level}-N${i}`,
                    x: 50 + nodeSpacing * (i + 1),
                    y: layer.y,
                    level: layer.level,
                    color: layer.color
                };
                allNodes.push(node);
            }
        });

        // Create connections within layers
        layers.forEach(layer => {
            const layerNodes = allNodes.filter(n => n.level === layer.level);
            for (let i = 0; i < layerNodes.length - 1; i++) {
                // Connect to nearby neighbors (skip some for visual clarity)
                if (i % 2 === 0 || layer.level > 0) {
                    layerConnections.push({
                        source: layerNodes[i],
                        target: layerNodes[i + 1],
                        level: layer.level
                    });
                }
                // Long-range connections
                if (layer.level > 0 && i + 2 < layerNodes.length) {
                    layerConnections.push({
                        source: layerNodes[i],
                        target: layerNodes[i + 2],
                        level: layer.level,
                        longRange: true
                    });
                }
            }
        });

        // Create vertical connections between layers
        const verticalConnections = [];
        const layer2Nodes = allNodes.filter(n => n.level === 2);
        const layer1Nodes = allNodes.filter(n => n.level === 1);
        const layer0Nodes = allNodes.filter(n => n.level === 0);

        layer2Nodes.forEach((node, i) => {
            // Connect to nearby nodes in layer 1
            const targetIndex = Math.floor(i * (layer1Nodes.length / layer2Nodes.length));
            if (layer1Nodes[targetIndex]) {
                verticalConnections.push({
                    source: node,
                    target: layer1Nodes[targetIndex]
                });
            }
        });

        layer1Nodes.forEach((node, i) => {
            // Connect to nearby nodes in layer 0
            const targetIndex = Math.floor(i * (layer0Nodes.length / layer1Nodes.length));
            if (layer0Nodes[targetIndex]) {
                verticalConnections.push({
                    source: node,
                    target: layer0Nodes[targetIndex]
                });
            }
        });

        // Draw layer backgrounds
        layers.forEach(layer => {
            svg.append('rect')
                .attr('x', 30)
                .attr('y', layer.y - 30)
                .attr('width', width - 60)
                .attr('height', 60)
                .attr('rx', 8)
                .attr('fill', layer.color)
                .attr('fill-opacity', 0.1)
                .attr('stroke', layer.color)
                .attr('stroke-opacity', 0.3);

            svg.append('text')
                .text(layer.label)
                .attr('x', 45)
                .attr('y', layer.y - 12)
                .attr('fill', layer.color)
                .attr('font-size', '12px')
                .attr('font-weight', '500');
        });

        // Draw vertical connections first (behind everything)
        svg.append('g')
            .attr('class', 'vertical-connections')
            .selectAll('line')
            .data(verticalConnections)
            .join('line')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)
            .attr('stroke', '#475569')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,4')
            .attr('stroke-opacity', 0.5);

        // Draw layer connections
        svg.append('g')
            .attr('class', 'layer-connections')
            .selectAll('line')
            .data(layerConnections)
            .join('line')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)
            .attr('stroke', d => d.longRange ? '#22d3ee' : '#64748b')
            .attr('stroke-width', d => d.longRange ? 2 : 1.5)
            .attr('stroke-opacity', d => d.longRange ? 0.8 : 0.6);

        // Draw nodes
        svg.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(allNodes)
            .join('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => d.level === 2 ? 10 : d.level === 1 ? 8 : 6)
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', (d.level === 2 ? 10 : d.level === 1 ? 8 : 6) + 4);

                // Show tooltip
                showTooltip(event, `Node ${d.id}<br/>Level: ${d.level}`);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', d.level === 2 ? 10 : d.level === 1 ? 8 : 6);

                hideTooltip();
            });

        // Add query point animation
        const queryPoint = svg.append('g')
            .attr('class', 'query-point');

        queryPoint.append('circle')
            .attr('cx', width - 80)
            .attr('cy', 50)
            .attr('r', 12)
            .attr('fill', '#22d3ee')
            .attr('stroke', '#fff')
            .attr('stroke-width', 3);

        queryPoint.append('text')
            .text('Query')
            .attr('x', width - 80)
            .attr('y', 75)
            .attr('text-anchor', 'middle')
            .attr('fill', '#22d3ee')
            .attr('font-size', '11px')
            .attr('font-weight', '600');

        // Add legend for connections
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 180}, ${height - 60})`);

        legend.append('line')
            .attr('x1', 0).attr('y1', 0)
            .attr('x2', 30).attr('y2', 0)
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2);

        legend.append('text')
            .text('Local connection')
            .attr('x', 40).attr('y', 4)
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px');

        legend.append('line')
            .attr('x1', 0).attr('y1', 20)
            .attr('x2', 30).attr('y2', 20)
            .attr('stroke', '#22d3ee')
            .attr('stroke-width', 2);

        legend.append('text')
            .text('Long-range connection')
            .attr('x', 40).attr('y', 24)
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px');

        legend.append('line')
            .attr('x1', 0).attr('y1', 40)
            .attr('x2', 30).attr('y2', 40)
            .attr('stroke', '#475569')
            .attr('stroke-dasharray', '4,4')
            .attr('stroke-width', 1);

        legend.append('text')
            .text('Cross-layer link')
            .attr('x', 40).attr('y', 44)
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px');
    }

    // ===========================================
    // TOOLTIP HELPER
    // ===========================================

    function showTooltip(event, html) {
        let tooltip = document.getElementById('d3-tooltip');

        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'd3-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                padding: 8px 12px;
                background: rgba(15, 23, 42, 0.95);
                border: 1px solid rgba(99, 102, 241, 0.5);
                border-radius: 6px;
                color: #e2e8f0;
                font-size: 12px;
                pointer-events: none;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            `;
            document.body.appendChild(tooltip);
        }

        tooltip.innerHTML = html;
        tooltip.style.left = (event.clientX + 15) + 'px';
        tooltip.style.top = (event.clientY - 10) + 'px';
        tooltip.style.opacity = '1';
    }

    function hideTooltip() {
        const tooltip = document.getElementById('d3-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
        }
    }

    // ===========================================
    // D3 DRAG BEHAVIOR (v7 compatible)
    // ===========================================

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    // ===========================================
    // SCROLL ANIMATIONS
    // ===========================================

    function initAnimations() {
        // Intersection Observer for fade-in animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements for animation
        const animateElements = document.querySelectorAll(
            '.summary-card, .arch-card, .ops-card, .db-card, .metric-card, ' +
            '.rag-step, .paper-item, .doc-card, .video-card, .shift-card'
        );

        animateElements.forEach(el => {
            el.classList.add('animate-target');
            observer.observe(el);
        });

        // Add staggered animation delay to cards in grids
        document.querySelectorAll('.summary-grid, .arch-cards, .ops-grid, .metrics-grid').forEach(grid => {
            const children = grid.children;
            Array.from(children).forEach((child, i) => {
                child.style.transitionDelay = `${i * 100}ms`;
            });
        });
    }

    // ===========================================
    // UTILITY: DEBOUNCE
    // ===========================================

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===========================================
    // WINDOW RESIZE HANDLER
    // ===========================================

    const graphInitFunctions = {
        'architectureGraph': initArchitectureGraph,
        'crawlerGraph': initCrawlerGraph,
        'batchingGraph': initBatchingGraph,
        'ragGraph': initRAGGraph,
        'mindmapGraph': initMindmapGraph,
        'matrixLinkGraph': initMatrixLinkGraph,
        'hnswVisualization': initHNSWVisualization
    };

    const handleResize = debounce(() => {
        // Only re-render graphs that have been initialized (lazy loaded)
        initializedGraphs.forEach(graphId => {
            const initFn = graphInitFunctions[graphId];
            if (initFn) {
                initFn();
            }
        });
    }, 250);

    window.addEventListener('resize', handleResize);

})();
