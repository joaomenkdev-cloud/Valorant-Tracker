/* ============================================================
   VCI ANALYTICS — CHARTS.JS
   Chart.js chart builders
============================================================ */

let mmrChartInst  = null;
let radarChartInst = null;

/**
 * Build / rebuild the MMR progression line chart.
 * @param {number} days  - how many days to show (7 / 30 / 60 / 90)
 */
function buildMmrChart(days) {
  const ctx = document.getElementById('mmrChart');
  if (!ctx) return;
  if (mmrChartInst) mmrChartInst.destroy();

  const data = MMR_HIST.slice(-days);
  const mn   = Math.min(...data.map(x => x.v)) - 60;
  const mx   = Math.max(...data.map(x => x.v)) + 60;

  mmrChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(x => 'D' + x.d),
      datasets: [{
        data: data.map(x => x.v),
        borderColor: '#ff4655',
        backgroundColor: c => {
          const g = c.chart.ctx.createLinearGradient(0, 0, 0, 250);
          g.addColorStop(0, 'rgba(255,70,85,0.2)');
          g.addColorStop(1, 'rgba(255,70,85,0)');
          return g;
        },
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#ff4655',
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1c2333',
          titleColor: '#ece8e1',
          bodyColor: '#9ba4b2',
          borderColor: 'rgba(255,255,255,0.07)',
          borderWidth: 1,
          padding: 9,
          displayColors: false,
          callbacks: { label: c => 'MMR: ' + c.raw }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          border: { display: false },
          ticks: { color: '#5c6575', font: { size: 9.5 }, maxTicksLimit: 10 }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          border: { display: false },
          ticks: { color: '#5c6575', font: { size: 9.5 } },
          min: mn, max: mx
        }
      },
      interaction: { intersect: false, mode: 'index' }
    }
  });
}

/**
 * Build the performance radar chart.
 */
function buildRadarChart() {
  const ctx = document.getElementById('radarChart');
  if (!ctx) return;
  if (radarChartInst) radarChartInst.destroy();

  radarChartInst = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Aim', 'Positioning', 'Game Sense', 'Utility', 'Teamplay', 'Economy'],
      datasets: [
        {
          label: 'You',
          data: [85, 72, 78, 65, 70, 82],
          borderColor: '#ff4655',
          backgroundColor: 'rgba(255,70,85,0.13)',
          borderWidth: 2,
          pointBackgroundColor: '#ff4655',
          pointRadius: 3,
        },
        {
          label: 'Rank Avg',
          data: [70, 70, 70, 70, 70, 70],
          borderColor: '#3ddcb0',
          backgroundColor: 'rgba(61,220,176,0.07)',
          borderWidth: 1.5,
          pointBackgroundColor: '#3ddcb0',
          pointRadius: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: '#9ba4b2', padding: 12, font: { size: 10 } }
        }
      },
      scales: {
        r: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          pointLabels: { color: '#9ba4b2', font: { size: 10 } },
          ticks: { display: false },
          min: 0, max: 100
        }
      }
    }
  });
}
