import React, { useEffect, useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { FlavorScore } from "../types/coffee";

interface FlavorScoreChartProps {
  flavorScore: FlavorScore;
}

const PolarChart: React.FC<FlavorScoreChartProps> = ({ flavorScore }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    let count = -1;
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5radar.RadarChart.new(root, {
        panX: false,
        panY: false,
        startAngle: -90,
        endAngle: 270,
        // Vô hiệu hóa các sự kiện tương tác
        interactive: false
      })
    );

    // const cursor = chart.set(
    //   "cursor",
    //   am5radar.RadarCursor.new(root, {})
    // );
    // cursor.lineY.set("visible", false);

    const xRenderer = am5radar.AxisRendererCircular.new(root, {
      minGridDistance: 20,
      cellStartLocation: 0,
      cellEndLocation: 1
    });

    xRenderer.labels.template.setAll({
      radius: 10,
      fontSize: 12,
      textType: "circular",
      fill: am5.color("#A3A3A3"),
    });

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0,
        categoryField: "name",
        renderer: xRenderer,
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
      // Thêm dòng này để ẩn số ở yAxis
      visible: false
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: yRenderer,
        min: 0,
        max: 5,
        strictMinMax: true,
        numberFormat: "#",
      })
    );

    const series = chart.series.push(
      am5radar.RadarColumnSeries.new(root, {
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

    series.columns.template.setAll({
      strokeOpacity: 0,
      width: am5.percent(100)
    });

    // Replace the labels code with this bullets configuration
    series.bullets.push((root, index: any) => {
      count += 1;
      console.log(root);
      console.log(index);

      if(data[count].value === 0) return;
      
      console.log("{valueY}");
      return am5.Bullet.new(root, {
        locationY: 1,
        sprite: am5.Label.new(root, {
          text: "{valueY}",
          fill: am5.color('#A3A3A3'),
          centerX: am5.p50,
          centerY: am5.p50,
          populateText: true,
          fontSize: 12,
          // Thêm dy để đẩy label lên cao hơn một chút
          dy: count === 0 ? -7 : count === 1 ? -7 : count === 2 ? -4 : count === 3 ? 0 : count === 4 ? 1 : count === 5 ? 5 : count === 6 ? 7 : count === 7 ? 5 : count === 8 ? 5 : count === 9 ? -0 : count === 10 ? -5 : count === 11 ? -5 : 0,
          dx: count === 0 ? 0 : count === 1 ? 5 : count === 2 ? 7 : count === 3 ? 7 : count === 4 ? 7 : count === 5 ? 7 : count === 6 ? -3 : count === 7 ? -6 : count === 8 ? -5 : count === 9 ? -7 : count === 10 ? -5 : count === 11 ? -3 : 0,
        })
      });
    });

    series.columns.template.adapters.add("fill", function (fill, target) {
      const dataContext = target.dataItem?.dataContext as { fill: am5.Color };
      return dataContext?.fill || am5.color(0x000000);
    });

    const data = [
      {
        name: 'Floral',
        value: flavorScore.floral,
        fill: am5.color(0xFF6384)
      },
      {
        name: 'Honey',
        value: flavorScore.honey,
        fill: am5.color(0xFFCE56)
      },
      {
        name: 'Sugars',
        value: flavorScore.sugars,
        fill: am5.color(0xFF9F40)
      },
      {
        name: 'Caramel',
        value: flavorScore.caramel,
        fill: am5.color(0xB59332)
      },
      {
        name: 'Fruits',
        value: flavorScore.fruits,
        fill: am5.color(0xFF6347)
      },
      {
        name: 'Citrus',
        value: flavorScore.citrus,
        fill: am5.color(0xFF8C00)
      },
      {
        name: 'Berry',
        value: flavorScore.berry,
        fill: am5.color(0x9400D3)
      },
      {
        name: 'Cocoa',
        value: flavorScore.cocoa,
        fill: am5.color(0x8B4513)
      },
      {
        name: 'Nuts',
        value: flavorScore.nuts,
        fill: am5.color(0xA0522D)
      },
      {
        name: 'Rustic',
        value: flavorScore.rustic,
        fill: am5.color(0x654321)
      },
      {
        name: 'Spice',
        value: flavorScore.spice,
        fill: am5.color(0x4BC0C0)
      },
      {
        name: 'Body',
        value: flavorScore.body,
        fill: am5.color(0x228B22)
      }
    ];

    series.data.setAll(data);
    xAxis.data.setAll(data);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [flavorScore]);

  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      <div ref={chartRef} style={{ width: "100%", height: "300px" }} />
      <div
        style={{
          height: "20px",
          width: '100%',
          background: 'white',
          position: 'absolute',
          bottom: '0px',
        }}
      >
      </div>
    </div>
  );
};

export default PolarChart;