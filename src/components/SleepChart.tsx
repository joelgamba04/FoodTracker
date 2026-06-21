import React from "react";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";

export type ChartPoint = {
  label: string;
  value: number;
};

type SleepQualityChartProps = {
  data: ChartPoint[];
  width?: number;
  height?: number;
  maxValue?: number;
};

const SleepQualityChart = ({
  data,
  width = 320,
  height = 170,
  maxValue = 100,
}: SleepQualityChartProps) => {
  const min = 0;
  const chartTop = 15;
  const chartBottom = 32;
  const chartHeight = height - chartTop - chartBottom;
  const chartLeft = 32;
  const chartWidth = width - chartLeft - 10;

  const points = data.map((item, index) => {
    const x = chartLeft + (index / (data.length - 1)) * chartWidth;
    const y =
      chartTop +
      chartHeight -
      ((item.value - min) / (maxValue - min)) * chartHeight;

    return { ...item, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `
    ${linePath}
    L ${points[points.length - 1].x} ${chartTop + chartHeight}
    L ${points[0].x} ${chartTop + chartHeight}
    Z
  `;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sleepFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0B3D91" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#0B3D91" stopOpacity="0.02" />
        </LinearGradient>
      </Defs>

      {[0, 25, 50, 75, 100].map((tick) => {
        const y = chartTop + chartHeight - (tick / maxValue) * chartHeight;

        return (
          <React.Fragment key={tick}>
            <SvgText x={0} y={y + 4} fontSize="9" fill="#9CA3AF">
              {tick}
            </SvgText>

            <Path
              d={`M ${chartLeft} ${y} L ${width} ${y}`}
              stroke="#DCEAFF"
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          </React.Fragment>
        );
      })}

      <Path d={areaPath} fill="url(#sleepFill)" />
      <Path d={linePath} stroke="#0B3D91" strokeWidth={3} fill="none" />

      {points.map((point) => (
        <React.Fragment key={point.label}>
          <Circle cx={point.x} cy={point.y} r={4} fill="#0B3D91" />

          <SvgText
            x={point.x}
            y={height - 8}
            fontSize="10"
            fill="#6B7280"
            textAnchor="middle"
          >
            {point.label}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
};

export default SleepQualityChart;
