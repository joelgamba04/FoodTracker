// src/components/StepsChart.tsx

import { COLORS } from "@/theme/color";
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
  color?: string;
  fillColor?: string;
  goal?: number;
  activeIndex?: number;
};

const StepsChart = ({
  data,
  width = 320,
  height = 190,
  maxValue = 12000,
  color = COLORS.taguigBlue,
  fillColor = COLORS.taguigBlue,
  goal = 10000,
  activeIndex,
}: StepsChartProps) => {
  const chartTop = 24;
  const chartBottom = 32;
  const chartLeft = 32;
  const chartRight = 10;
  const chartHeight = height - chartTop - chartBottom;
  const chartWidth = width - chartLeft - chartRight;

  const safeData = data.length > 0 ? data : [{ label: "-", value: 0 }];
  const max = Math.max(
    maxValue,
    goal,
    ...safeData.map((item) => item.value),
    1,
  );

  const barWidth = Math.min(26, chartWidth / safeData.length / 1.8);
  const gap =
    safeData.length > 1
      ? (chartWidth - safeData.length * barWidth) / (safeData.length - 1)
      : 0;

  const goalY = chartTop + chartHeight - (goal / max) * chartHeight;

  return (
    <Svg width={width} height={height}>
      {[0, max * 0.25, max * 0.5, max * 0.75, max].map((tick) => {
        const y = chartTop + chartHeight - (tick / max) * chartHeight;

        return (
          <React.Fragment key={tick}>
            <SvgText x={0} y={y + 4} fontSize="9" fill="#9CA3AF">
              {tick === 0 ? "0" : `${Math.round(tick / 1000)}K`}
            </SvgText>

            <Line
              x1={chartLeft}
              y1={y}
              x2={width - chartRight}
              y2={y}
              stroke="#DCEAFF"
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          </React.Fragment>
        );
      })}

      <Line
        x1={chartLeft}
        y1={goalY}
        x2={width - chartRight}
        y2={goalY}
        stroke="#BBD7FF"
        strokeWidth={2}
        strokeDasharray="7 6"
      />

      <SvgText
        x={width - chartRight}
        y={14}
        fontSize="11"
        fontWeight="800"
        fill={COLORS.taguigBlue}
        textAnchor="end"
      >
        {`Goal ${Math.round(goal / 1000)}K`}
      </SvgText>

      {safeData.map((item, index) => {
        const x =
          safeData.length > 1
            ? chartLeft + index * (barWidth + gap)
            : chartLeft + chartWidth / 2 - barWidth / 2;

        const barHeight = Math.max(2, (item.value / max) * chartHeight);
        const y = chartTop + chartHeight - barHeight;
        const isActive =
          typeof activeIndex === "number"
            ? index === activeIndex
            : index === safeData.length - 1;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            <SvgText
              x={x + barWidth / 2}
              y={y - 8}
              fontSize="10"
              fontWeight="800"
              fill="#07143B"
              textAnchor="middle"
            >
              {item.value.toLocaleString()}
            </SvgText>

            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={6}
              fill={isActive ? color : fillColor}
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
