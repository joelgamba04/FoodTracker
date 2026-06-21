import React from "react";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

export type ChartPoint = {
  label: string;
  value: number;
};

type StepsChartProps = {
  data: ChartPoint[];
  width?: number;
  height?: number;
  maxValue?: number;
};

const StepsChart = ({
  data,
  width = 320,
  height = 170,
  maxValue = 15000,
}: StepsChartProps) => {
  const chartTop = 15;
  const chartBottom = 32;
  const chartHeight = height - chartTop - chartBottom;
  const barWidth = 26;

  const safeData = data.length > 0 ? data : [{ label: "-", value: 0 }];
  const max = Math.max(maxValue, ...safeData.map((item) => item.value), 1);

  const gap =
    safeData.length > 1
      ? (width - 50 - safeData.length * barWidth) / (safeData.length - 1)
      : 0;

  return (
    <Svg width={width} height={height}>
      {[0, max * 0.33, max * 0.66, max].map((tick) => {
        const y = chartTop + chartHeight - (tick / max) * chartHeight;

        return (
          <React.Fragment key={tick}>
            <SvgText x={0} y={y + 4} fontSize="9" fill="#9CA3AF">
              {tick === 0 ? "0" : `${Math.round(tick / 1000)}K`}
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

      {safeData.map((item, index) => {
        const x =
          safeData.length > 1
            ? 42 + index * (barWidth + gap)
            : width / 2 - barWidth / 2;

        const barHeight = (item.value / max) * chartHeight;
        const y = chartTop + chartHeight - barHeight;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
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
