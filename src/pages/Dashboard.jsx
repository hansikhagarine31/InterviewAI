import { useEffect, useState } from "react";
import api from "../api/client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
function Dashboard() {

  const [history, setHistory] = useState([]);

  useEffect(() => {

  const fetchHistory =
    async () => {

      try {

        const user =
          JSON.parse(
            localStorage.getItem(
              "user"
            )
          );

        if (!user) return;

        const res =
          await api.get(
            `/user-history/${user.id}`
          );

        setHistory(res.data);

      } catch (err) {

        console.log(err);

      }

    };

  fetchHistory();

}, []);  

  const totalInterviews =
    history.length;

  const scores =
    history.map(
      item => Number(item.score)
    );

  const bestScore =
    scores.length
      ? Math.max(...scores)
      : 0;

  const averageScore =
    scores.length
      ? (
          scores.reduce(
            (a, b) => a + b,
            0
          ) / scores.length
        ).toFixed(1)
      : 0;
    const chartData = {
  labels: history.map(
    (_, index) =>
      `Interview ${index + 1}`
  ),

  datasets: [
    {
      label: "Score Trend",

      data: history.map(
        item =>
          Number(item.score)
      ),

      borderColor: "#00d4ff",

      backgroundColor:
        "rgba(0,212,255,0.2)",

      tension: 0.4,
    },
  ],
};
  return (

    <div className="container fade-in">

      <h1>Dashboard 📊</h1>

      <div className="dashboard-grid">

        <div className="dashboard-card">
          <h2>{totalInterviews}</h2>
          <p>Total Interviews</p>
        </div>

        <div className="dashboard-card">
          <h2>{bestScore}</h2>
          <p>Best Score</p>
        </div>

        <div className="dashboard-card">
          <h2>{averageScore}</h2>
          <p>Average Score</p>
        </div>

      </div>

    <div
  className="question-box"
  style={{
    textAlign: "center",
    marginTop: "30px"
  }}
>

<h2>
🎯 Overall Performance
</h2>

<h1
  style={{
    marginTop: "20px",
    fontSize: "34px"
  }}
>
{
averageScore >= 90

?

"🏆"

:

averageScore >= 80

?

"⭐"

:

averageScore >= 70

?

"👍"

:

averageScore >= 60

?

"📈"

:

"📚"

}
</h1>

<h3
  style={{
    marginTop: "10px"
  }}
>

{

averageScore >= 90

?

"Outstanding"

:

averageScore >= 80

?

"Excellent"

:

averageScore >= 70

?

"Good"

:

averageScore >= 60

?

"Improving"

:

"Needs Practice"

}

</h3>

<p
  style={{
    marginTop: "15px",
    opacity: .9
  }}
>

{

averageScore >= 90

?

"You're interview-ready. Keep it up!"

:

averageScore >= 80

?

"Excellent work! A little more practice and you'll be exceptional."

:

averageScore >= 70

?

"You're progressing well. Stay consistent."

:

averageScore >= 60

?

"Practice regularly to improve your confidence."

:

"Keep practicing. Every interview makes you stronger."

}

</p>

</div>
      <h2
        style={{
          marginTop: "40px"
        }}
      >
        Recent Interviews
      </h2>
        <div
  className="chart-card"
>
  <h2>
    Performance Trend
  </h2>

  <Line
  data={chartData}
  options={{

    responsive: true,

    plugins: {

      legend: {

        display: false

      }

    },

    scales: {

      y: {

        min: 0,

        max: 100,

        ticks: {

          stepSize: 20

        }

      }

    }

  }}
/>
</div>
      {

        history.length === 0 ?

        <p>
          No interviews taken yet.
        </p>

        :

        history.slice(0, 5).map(
          (item, index) => (

            <div
              key={index}
              className="history-card"
            >
              <h3>
                Score:
                {" "}
                {item.score}/100
              </h3>

              <p>
                {item.date}
              </p>

            </div>

          )
        )

      }

    </div>

  );
}

export default Dashboard;