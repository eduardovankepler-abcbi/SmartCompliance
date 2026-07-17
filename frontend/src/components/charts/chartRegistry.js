import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from "chart.js";

let isRegistered = false;

export function registerDashboardCharts() {
  if (isRegistered) {
    return;
  }

  ChartJS.register(
    LineController,
    DoughnutController,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Filler,
    Tooltip,
    Legend
  );
  isRegistered = true;
}
