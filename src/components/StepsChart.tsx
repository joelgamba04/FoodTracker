import React from "react";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

const stepsData = [
  { label: "Mon", value: 12000 },
  { label: "Tue", value: 8000 },
  { label: "Wed", value: 10500 },
  { label: "Thu", value: 7500 },
  { label: "Fri", value: 6000 },
  { label: "Sat", value: 11000 },
  { label: "Sun", value: 8200 },
];

const StepsChart = ({ width = 320, height = 170 }) => {
  const max = 15000;
  const chartTop = 15;
  const chartBottom = 32;
  const chartHeight = height - chartTop - chartBottom;
  const barWidth = 26;
  const gap =
    (width - 50 - stepsData.length * barWidth) / (stepsData.length - 1);

  return (
    <Svg width={width} height={height}>
      {[0, 5000, 10000, 15000].map((tick) => {
        const y = chartTop + chartHeight - (tick / max) * chartHeight;

        return (
          <React.Fragment key={tick}>
            <SvgText x={0} y={y + 4} fontSize="9" fill="#9CA3AF">
              {tick === 0 ? "0" : tick / 1000 + "K"}
            </SvgText>

            <Line
              x1={28}
              y1={y}
              x2={width}
              y2={y}
              stroke="#DCEAFF"
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          </React.Fragment>
        );
      })}

      {stepsData.map((item, index) => {
        const x = 42 + index * (barWidth + gap);
        const barHeight = (item.value / max) * chartHeight;
        const y = chartTop + chartHeight - barHeight;

        return (
          <React.Fragment key={item.label}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={6}
              fill="#0057FF"
            />

            <SvgText
              x={x + barWidth / 2}
              y={height - 8}
              fontSize="10"
              fill="#6B7280"
              textAnchor="middle"
            >
              {item.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

export default StepsChart;
