/**
 * FPL Player Data Visualizations
 * Advanced charting and visualization for player statistics
 */

class PlayerVisualization {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#37003c',
            secondary: '#00ff85',
            danger: '#e90052',
            warning: '#fdb913',
            info: '#04f5ff',
            dark: '#1e1e1e',
            light: '#f0f0f0',
            gradient1: ['#37003c', '#00ff85'],
            gradient2: ['#e90052', '#fdb913'],
            gradient3: ['#04f5ff', '#37003c']
        };
        this.chartConfig = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        };
    }

    /**
     * Initialize Chart.js with CDN fallback
     */
    async initChartLibrary() {
        return new Promise((resolve) => {
            if (window.Chart) {
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.onload = () => resolve(true);
            script.onerror = () => {
                console.warn('Chart.js CDN failed, using fallback');
                this.useFallbackCharts();
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Create form vs fixture difficulty chart
     */
    createFormChart(canvasId, playerData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) return;

        // Destroy existing chart
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, this.colors.secondary);
        gradient.addColorStop(1, 'rgba(0, 255, 133, 0.1)');

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: playerData.gameweeks || ['GW1', 'GW2', 'GW3', 'GW4', 'GW5'],
                datasets: [{
                    label: 'Points',
                    data: playerData.points || [8, 12, 3, 15, 7],
                    borderColor: this.colors.secondary,
                    backgroundColor: gradient,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 2
                }, {
                    label: 'xG',
                    data: playerData.xG || [0.8, 1.2, 0.3, 1.5, 0.7],
                    borderColor: this.colors.info,
                    backgroundColor: 'rgba(4, 245, 255, 0.1)',
                    tension: 0.4,
                    borderDash: [5, 5],
                    pointRadius: 4
                }]
            },
            options: {
                ...this.chartConfig,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 30, 30, 0.95)',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: {
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            afterLabel: (context) => {
                                if (context.dataset.label === 'Points') {
                                    return `Fixture Difficulty: ${playerData.difficulty?.[context.dataIndex] || 3}`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                family: "'Inter', sans-serif",
                                size: 11
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: "'Inter', sans-serif",
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create ownership trend radar chart
     */
    createOwnershipRadar(canvasId, playerData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) return;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');

        this.charts[canvasId] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Goals', 'Assists', 'BPS', 'ICT Index', 'Value', 'Form'],
                datasets: [{
                    label: playerData.name || 'Player',
                    data: playerData.stats || [85, 70, 90, 88, 75, 92],
                    borderColor: this.colors.primary,
                    backgroundColor: 'rgba(55, 0, 60, 0.2)',
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.colors.primary,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }, {
                    label: 'Top 10k Average',
                    data: [70, 65, 75, 80, 70, 85],
                    borderColor: this.colors.warning,
                    backgroundColor: 'rgba(253, 185, 19, 0.1)',
                    pointRadius: 4,
                    borderDash: [3, 3]
                }]
            },
            options: {
                ...this.chartConfig,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${context.parsed.r}%`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        pointLabels: {
                            font: {
                                size: 11,
                                family: "'Inter', sans-serif",
                                weight: '500'
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create price change prediction chart
     */
    createPriceTrendChart(canvasId, playerData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) return;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Last 7d', 'Last 3d', 'Yesterday', 'Today', 'Tomorrow', 'Next 3d', 'Next 7d'],
                datasets: [{
                    label: 'Price Change %',
                    data: playerData.priceChanges || [-0.1, 0, 0.2, 0.5, 0.8, 1.2, 1.5],
                    backgroundColor: (context) => {
                        const value = context.raw;
                        return value < 0 ? this.colors.danger : this.colors.secondary;
                    },
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 30
                }]
            },
            options: {
                ...this.chartConfig,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const direction = value >= 0 ? '📈' : '📉';
                                return `${direction} ${value > 0 ? '+' : ''}${value}%`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: 0,
                                yMax: 0,
                                borderColor: 'rgba(0, 0, 0, 0.3)',
                                borderWidth: 1,
                                borderDash: [5, 5]
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * Create comparison chart for multiple players
     */
    createComparisonChart(canvasId, playersData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) return;

        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');

        const datasets = playersData.map((player, index) => ({
            label: player.name,
            data: player.stats,
            backgroundColor: Object.values(this.colors)[index % 5],
            borderColor: Object.values(this.colors)[index % 5],
            borderWidth: 2
        }));

        this.charts[canvasId] = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: ['Goals', 'Assists', 'Clean Sheets', 'BPS', 'Minutes'],
                datasets: datasets
            },
            options: {
                ...this.chartConfig,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * Create mini sparkline charts
     */
    createSparkline(canvasId, data, color = this.colors.primary) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) return;

        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((_, i) => i),
                datasets: [{
                    data: data,
                    borderColor: color,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                elements: {
                    line: {
                        borderCapStyle: 'round'
                    }
                }
            }
        });
    }

    /**
     * Fallback SVG-based charts when Chart.js fails
     */
    useFallbackCharts() {
        console.log('Using SVG fallback charts');
        
        this.createSVGLineChart = (containerId, data) => {
            const container = document.getElementById(containerId);
            if (!container) return;

            const width = container.offsetWidth;
            const height = 300;
            const padding = 40;
            
            const maxValue = Math.max(...data.values);
            const xScale = (width - padding * 2) / (data.labels.length - 1);
            const yScale = (height - padding * 2) / maxValue;

            const points = data.values.map((value, index) => ({
                x: padding + index * xScale,
                y: height - padding - value * yScale
            }));

            const pathData = points.map((point, index) => 
                `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
            ).join(' ');

            const svg = `
                <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:${this.colors.secondary};stop-opacity:0.8" />
                            <stop offset="100%" style="stop-color:${this.colors.secondary};stop-opacity:0.1" />
                        </linearGradient>
                    </defs>
                    
                    <!-- Grid lines -->
                    ${Array.from({length: 5}, (_, i) => {
                        const y = padding + i * (height - padding * 2) / 4;
                        return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" 
                                stroke="rgba(0,0,0,0.1)" stroke-dasharray="3,3"/>`;
                    }).join('')}
                    
                    <!-- Area -->
                    <path d="${pathData} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z"
                          fill="url(#gradient)" opacity="0.3"/>
                    
                    <!-- Line -->
                    <path d="${pathData}" fill="none" stroke="${this.colors.secondary}" 
                          stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    
                    <!-- Points -->
                    ${points.map(point => 
                        `<circle cx="${point.x}" cy="${point.y}" r="5" 
                         fill="white" stroke="${this.colors.secondary}" stroke-width="2"/>`
                    ).join('')}
                    
                    <!-- Labels -->
                    ${data.labels.map((label, index) => 
                        `<text x="${padding + index * xScale}" y="${height - 10}" 
                         text-anchor="middle" font-size="11" fill="#666">${label}</text>`
                    ).join('')}
                </svg>
            `;

            container.innerHTML = svg;
        };
    }

    /**
     * Animate number counters
     */
    animateCounter(element, target, duration = 1000) {
        const start = parseInt(element.textContent) || 0;
        const range = target - start;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuad = progress * (2 - progress);
            const current = Math.round(start + range * easeOutQuad);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Create heatmap for player positions
     */
    createPositionHeatmap(containerId, positionData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const pitch = `
            <div class="pitch-container">
                <svg viewBox="0 0 100 64" class="pitch-svg">
                    <!-- Pitch outline -->
                    <rect x="0" y="0" width="100" height="64" fill="#4a9d4a" stroke="white" stroke-width="0.5"/>
                    
                    <!-- Center line -->
                    <line x1="50" y1="0" x2="50" y2="64" stroke="white" stroke-width="0.5"/>
                    
                    <!-- Center circle -->
                    <circle cx="50" cy="32" r="9" fill="none" stroke="white" stroke-width="0.5"/>
                    
                    <!-- Penalty areas -->
                    <rect x="0" y="20" width="16" height="24" fill="none" stroke="white" stroke-width="0.5"/>
                    <rect x="84" y="20" width="16" height="24" fill="none" stroke="white" stroke-width="0.5"/>
                    
                    <!-- Goal areas -->
                    <rect x="0" y="26" width="5" height="12" fill="none" stroke="white" stroke-width="0.5"/>
                    <rect x="95" y="26" width="5" height="12" fill="none" stroke="white" stroke-width="0.5"/>
                    
                    <!-- Position heatmap -->
                    ${(positionData || []).map(pos => `
                        <circle cx="${pos.x}" cy="${pos.y}" r="${pos.intensity * 5}" 
                                fill="${this.colors.danger}" opacity="${pos.intensity * 0.5}"/>
                    `).join('')}
                </svg>
            </div>
        `;

        container.innerHTML = pitch;
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Initialize visualization instance
const playerViz = new PlayerVisualization();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerVisualization;
}