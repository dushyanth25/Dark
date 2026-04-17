import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const ChartComponent = ({ priceHistory }) => {
  // Determine if it's currently spiking to enable pulsing yellow
  const lastPrice = priceHistory[priceHistory.length - 1];
  const prevPrice = priceHistory[priceHistory.length - 2];
  const isSpiking = (lastPrice - prevPrice) > 1.5;

  const data = {
    labels: priceHistory.map((_, i) => `T-${priceHistory.length - i}`),
    datasets: [
      {
        label: 'WayneTech Value Index',
        data: priceHistory,
        borderColor: '#FFD700',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
          gradient.addColorStop(1, 'rgba(255, 215, 0, 0.0)');
          return gradient;
        },
        fill: true,
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: '#050505',
        pointBorderColor: '#FFD700',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300, // smooth fast transition without jitter
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(18, 18, 18, 0.9)',
        titleColor: '#FFD700',
        bodyColor: '#e0e0e0',
        borderColor: '#FFD700',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#555555',
          callback: (value) => `$${value}`,
        },
      },
    },
  };

  return (
    <div className={`w-full h-full min-h-[300px] transition-all duration-300 ${isSpiking ? 'drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]' : ''}`}>
      <Line data={data} options={options} />
    </div>
  );
};

export default ChartComponent;
