document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });

    // CountUp Animation
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps

        let current = 0;
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.innerText = Math.ceil(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = target.toLocaleString();
            }
        };
        updateCounter();
    });

    // Chart Global Defaults
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.borderColor = '#2a2a2a';
    Chart.defaults.font.family = "'Poppins', sans-serif";

    // 1. Facebook Views Chart (Line)
    const fbCtx = document.getElementById('fbChart').getContext('2d');

    // Gradient for FB Chart
    const fbGradient = fbCtx.createLinearGradient(0, 0, 0, 400);
    fbGradient.addColorStop(0, 'rgba(212, 175, 55, 0.5)'); // Gold
    fbGradient.addColorStop(1, 'rgba(212, 175, 55, 0)');

    new Chart(fbCtx, {
        type: 'line',
        data: {
            labels: ['July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Facebook Views',
                data: [586000, 874000, 701000, 734000, 763000, 741000],
                borderColor: '#D4AF37',
                backgroundColor: fbGradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#D4AF37',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(26, 26, 26, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#ccc',
                    borderColor: '#333',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#2a2a2a' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // 2. Yearly Sales Chart (Bar + Line)
    const yearlyCtx = document.getElementById('yearlySalesChart').getContext('2d');
    new Chart(yearlyCtx, {
        type: 'bar', // Mixed chart
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                type: 'line',
                label: 'Trend',
                data: [321629, 301253, 221625, 242799, 342377, 227222, 393634, 437893, 282900, 456219, 493244, 526044],
                borderColor: '#60a5fa', // Blue
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0
            }, {
                type: 'bar',
                label: 'Sales (Taka)',
                data: [321629, 301253, 221625, 242799, 342377, 227222, 393634, 437893, 282900, 456219, 493244, 526044],
                backgroundColor: (context) => {
                    const value = context.raw;
                    return value > 500000 ? '#D4AF37' : '#333'; // Highlight high sales
                },
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { display: false }, // Hide y axis for cleaner look
                x: { grid: { display: false } }
            }
        }
    });

    // 3. Daily Sales Chart (December) - Simulated Data
    const dailyCtx = document.getElementById('dailySalesChart').getContext('2d');

    // Generate simulated daily data summing to ~526,044
    // Constraints: 26th = 46519, 21st = 2595. Total 526044.
    // Remaining days approx logic.
    let dailyData = Array(31).fill(0).map(() => Math.floor(Math.random() * (20000 - 10000) + 10000));

    // Fix specific dates
    dailyData[25] = 46519; // 26th (index 25)
    dailyData[20] = 2595;  // 21st (index 20)

    // Adjust total to match 526,044 closely
    let currentSum = dailyData.reduce((a, b) => a + b, 0);
    let diff = 526044 - currentSum;
    let distributedDiff = Math.floor(diff / 29); // Distribute among other days

    dailyData = dailyData.map((val, idx) => {
        if (idx === 25 || idx === 20) return val;
        return Math.max(0, val + distributedDiff);
    });

    new Chart(dailyCtx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: 31 }, (_, i) => i + 1),
            datasets: [{
                label: 'Daily Sales',
                data: dailyData,
                backgroundColor: (context) => {
                    const idx = context.dataIndex;
                    if (idx === 25) return '#22c55e'; // Peak Green
                    if (idx === 20) return '#ef4444'; // Low Red
                    return '#333';
                },
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => 'Dec ' + items[0].label
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: { display: false }
            }
        }
    });

    // 4. Target Chart (Doughnut)
    const targetChartCanvas = document.getElementById('targetChart');
    if (targetChartCanvas) {
        const targetCtx = targetChartCanvas.getContext('2d');
        new Chart(targetCtx, {
            type: 'doughnut',
            data: {
                labels: ['Achieved', 'Remaining'],
                datasets: [{
                    data: [526044, 69205],
                    backgroundColor: ['#D4AF37', '#333'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }
});
