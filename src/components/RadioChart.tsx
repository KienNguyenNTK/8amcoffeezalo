import React, { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { CuppingScore } from "types/coffee";
interface CuppingScoreChartProps {
  cuppingScore: CuppingScore;
}
const RadarChart: React.FC<CuppingScoreChartProps> = ({ cuppingScore }) => {
  const chartRef = useRef<HTMLDivElement>(null); // Tham chiếu đến div chứa biểu đồ

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    // Khởi tạo root element
    const root = am5.Root.new(chartRef.current);

    // Gắn theme
    root.setThemes([am5themes_Animated.new(root)]);

    // Tạo biểu đồ radar
    const chart = root.container.children.push(
      am5radar.RadarChart.new(root, {
        panX: false,
        panY: false,
        innerRadius: am5.percent(20),
        startAngle: -90,
        endAngle: 270
      })
    );

    // Thêm cursor
    const cursor = chart.set(
      "cursor",
      am5radar.RadarCursor.new(root, {})
    );
    cursor.lineY.set("visible", false);

    // Tạo các trục và renderers
    const xRenderer = am5radar.AxisRendererCircular.new(root, {
      minGridDistance: 20,
      cellStartLocation: 0,
      cellEndLocation: 1
    });
    xRenderer.labels.template.setAll({
      radius: 10,
      fontSize: 12,
      textType: "circular"
    });

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0,
        categoryField: "name",
        renderer: xRenderer,
        // tooltip: am5.Tooltip.new(root, {}),
      })
    );

    const yRenderer = am5radar.AxisRendererRadial.new(root, {
      minGridDistance: 10
    });

    yRenderer.labels.template.setAll({
      fontSize: 8,
      paddingRight: 0,
      textAlign: "start",
      centerX: am5.percent(100),
      centerY: am5.percent(50),
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: yRenderer,
        min: 0,
        max: 10,
        strictMinMax: true,
      })
    );

    // Tạo series
    const series = chart.series.push(
      am5radar.RadarLineSeries.new(root, {
        name: "Series",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        categoryXField: "name",
        tooltip: am5.Tooltip.new(root, { labelText: "{valueY}" }),
        fill: am5.color(0x6794dc),
        stroke: am5.color(0x6794dc),
      })
    );

    series.strokes.template.setAll({ strokeWidth: 2 });

    series.bullets.push(function () {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 5,
          fill: series.get("fill"),
        }),
        dynamic: true
      });
    });

    // Cài đặt dữ liệu
    const data = [
      { name: 'Fragrance', value: cuppingScore.fragrance },
      { name: 'Wet Aroma', value: cuppingScore.wetAroma },
      { name: 'Brightness', value: cuppingScore.brightness },
      { name: 'Flavor', value: cuppingScore.flavor },
      { name: 'Body', value: cuppingScore.body },
      { name: 'Finish', value: cuppingScore.finish },
      { name: 'Sweetness', value: cuppingScore.sweetness },
      { name: 'Clean Cup', value: cuppingScore.cleanCup },
      { name: 'Complexity', value: cuppingScore.complexity },
      { name: 'Uniformity', value: cuppingScore.uniformity },
    ];

    series.data.setAll(data);
    xAxis.data.setAll(data);

    // Hiệu ứng
    series.appear(1000);
    chart.appear(1000, 100);

    // Cleanup khi unmount component
    return () => {
      root.dispose();
    };
  }, []);

  return (
    <div style={{
      position: 'relative'
    }}  >
      <div ref={chartRef} style={{ width: "100%", height: "300px" }} />
      <div
        style={{
          height: "20px",
          width: '100%',
          background: 'white',
          position: 'absolute',
          bottom: '30px',
        }}
      >
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "10px",
          fontSize: "16px",
          fontWeight: "bold",
        }}
      >Score: {(cuppingScore.fragrance + cuppingScore.wetAroma + cuppingScore.brightness + cuppingScore.flavor + cuppingScore.body + cuppingScore.finish + cuppingScore.sweetness + cuppingScore.cleanCup + cuppingScore.complexity + cuppingScore.uniformity).toFixed(1)}</div>
    </div>
  );
};

export default RadarChart;
