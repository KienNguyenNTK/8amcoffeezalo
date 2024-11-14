import {
    ArcElement,
    Chart as ChartJS,
    Legend,
    RadialLinearScale,
    Tooltip,
} from 'chart.js';
import React from 'react';
import { PolarArea } from 'react-chartjs-2';
import { FlavorScore } from '../types/coffee';

// Đăng ký các components cần thiết
ChartJS.register(
    RadialLinearScale,
    ArcElement,
    Tooltip,
    Legend
);

interface FlavorScoreChartProps {
    flavorScore: FlavorScore;
}

const FlavorScoreChart: React.FC<FlavorScoreChartProps> = ({ flavorScore }) => {
    const data = {
        labels: ['Floral', 'Honey', 'Sugars', 'Caramel', 'Fruits', 'Citrus', 'Berry', 'Cocoa', 'Nuts', 'Rustic', 'Spice', 'Body'],
        datasets: [
            {
                data: [
                    flavorScore.floral,
                    flavorScore.honey,
                    flavorScore.sugars,
                    flavorScore.caramel,
                    flavorScore.fruits,
                    flavorScore.citrus,
                    flavorScore.berry,
                    flavorScore.cocoa,
                    flavorScore.nuts,
                    flavorScore.rustic,
                    flavorScore.spice,
                    flavorScore.body,
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',    // Floral - pink
                    'rgba(255, 206, 86, 0.8)',    // Honey - yellow
                    'rgba(255, 159, 64, 0.8)',    // Sugars - orange
                    'rgba(181, 147, 50, 0.8)',    // Caramel - brown
                    'rgba(255, 99, 71, 0.8)',     // Fruits - red
                    'rgba(255, 140, 0, 0.8)',     // Citrus - orange
                    'rgba(148, 0, 211, 0.8)',     // Berry - purple
                    'rgba(139, 69, 19, 0.8)',     // Cocoa - brown
                    'rgba(160, 82, 45, 0.8)',     // Nuts - brown
                    'rgba(101, 67, 33, 0.8)',     // Rustic - dark brown
                    'rgba(75, 192, 192, 0.8)',    // Spice - green
                    'rgba(34, 139, 34, 0.8)',     // Body - dark green
                ],
                borderWidth: 1,
                borderColor: 'white',
            },
        ],
    };

    const options = {
        scales: {
            r: {
                min: 0,
                max: 5,
                ticks: {
                    stepSize: 1,
                    display: true,
                    backdropColor: 'transparent'
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.3)',
                    circular: true
                },
                pointLabels: {
                    display: true,
                    centerPointLabels: true,
                    font: {
                        size: 12,
                        family: 'Inter'
                    },
                    padding: 5,
                    callback: (label: string) => label,
                }
            }
        },
        plugins: {
            legend: {
                display: false,
            }
        }
    };

    const renderCustomLegend = () => {
        return (
            <div className="grid grid-cols-4 gap-4">
                {data.labels.map((label, index) => (
                    <div key={label} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: data.datasets[0].backgroundColor[index] }}
                        />
                        <span className="text-sm text-gray-600">{label}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="w-full h-[300px] flex justify-center items-center">
                <PolarArea data={data} options={options} />
            </div>
            {renderCustomLegend()}
        </div>
    );
};

export default FlavorScoreChart; 