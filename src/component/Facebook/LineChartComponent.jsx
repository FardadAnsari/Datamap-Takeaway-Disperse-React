// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

// const LineChartComponent = ({
//   data,
//   xKey,
//   lineKey,
//   lineColor = "#8884d8",
//   height = 300,
// }) => {
//   return (
//     <ResponsiveContainer width="100%" height={height}>
//       <LineChart
//         data={data}
//         margin={{ top: 15, right: 50, left: 10, bottom: 5 }}
//       >
//         <XAxis
//           dataKey={xKey}
//           angle={-45}
//           textAnchor="end"
//           height={80}
//           dy={5}
//           style={{ fontSize: "12px", fill: "#333" }}
//         />
//         <YAxis />
//         <Tooltip />
//         <CartesianGrid strokeDasharray="3 3" />
//         <Line
//           type="monotone"
//           dataKey={lineKey}
//           stroke={lineColor}
//           strokeWidth={3}
//           dot={{ r: 4 }}
//           activeDot={{ r: 8 }}
//         />
//       </LineChart>
//     </ResponsiveContainer>
//   );
// };

// export default LineChartComponent;
