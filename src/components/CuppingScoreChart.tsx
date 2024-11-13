import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
} from 'recharts';
import { CuppingScore } from '../types/coffee';

interface CuppingScoreChartProps {
    cuppingScore: CuppingScore;
}

const CuppingScoreChart: React.FC<CuppingScoreChartProps> = ({ cuppingScore }) => {
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

    return (
        <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={250}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid gridType="polygon" />
                    <PolarAngleAxis
                        dataKey="name"
                        tick={{
                            fill: '#666',
                            fontSize: 12,
                            fontFamily: 'Inter'
                        }}
                    />
                    <Radar
                        name="Score"
                        dataKey="value"
                        stroke="#4A90E2"
                        fill="#4A90E2"
                        fillOpacity={0.3}
                    />
                </RadarChart>
            </ResponsiveContainer>
            {/* <div className="text-center mt-4 font-medium" style={{ fontFamily: 'monospace' }}>
                Cupper's Correction 2
            </div> */}
            <div className="text-center font-medium" style={{ fontFamily: 'monospace' }}>
                Score: {cuppingScore.total}
            </div>
        </div>
    );
};

export default CuppingScoreChart;