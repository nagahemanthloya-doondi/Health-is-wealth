import React, { useState } from 'react';
import { HealthyReport } from '../types';
import { NeoButton, NeoCard } from './NeoComponents';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ReportCardProps {
  report: HealthyReport;
  onReset: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onReset }) => {
  const [activeTab, setActiveTab] = useState<'NUTRIENTS' | 'INGREDIENTS'>('NUTRIENTS');

  // Determine color based on score
  let scoreColor = '#FFDE59'; // Yellow (Mid)
  if (report.score >= 80) scoreColor = '#7ED957'; // Green (Good)
  if (report.score < 50) scoreColor = '#FF5757'; // Red (Bad)

  const chartData = [
    { name: 'Score', value: report.score },
    { name: 'Remaining', value: 100 - report.score },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-10 duration-500">
      {/* Header Section */}
      <NeoCard className="bg-white" title="HEALTHY INFORMER REPORT">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Score Visualization */}
            <div className="relative w-40 h-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="#000"
                      strokeWidth={2}
                    >
                      <Cell fill={scoreColor} />
                      <Cell fill="#ffffff" />
                    </Pie>
                  </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black">{report.score}</span>
                  <span className="text-xs font-bold">/100</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-black mb-2 uppercase break-words leading-none">
                {report.productName}
              </h1>
              <div className="inline-block bg-black text-white px-3 py-1 font-bold text-sm transform -rotate-2">
                {report.barcode || "NO BARCODE"}
              </div>
              <div className="mt-4">
                <span className="block text-sm font-bold text-gray-500 uppercase">VERDICT</span>
                <span className={`text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-800`} style={{ WebkitTextStroke: '1px black', color: scoreColor }}>
                  {report.verdict}
                </span>
              </div>
            </div>
          </div>
          
          {/* Product Image from Open Food Facts */}
          {report.product_image && (
             <div className="w-full flex justify-center mt-2">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-black translate-x-2 translate-y-2"></div>
                  <img 
                    src={report.product_image} 
                    alt="Product Scan" 
                    className="relative w-48 h-48 object-contain bg-white border-4 border-black"
                  />
                  <div className="absolute top-2 right-2 bg-[#CB6CE6] text-white text-xs font-bold px-2 py-1 border-2 border-black -rotate-6 shadow-sm">
                    OFF IMG
                  </div>
                </div>
             </div>
          )}
        </div>
      </NeoCard>

      {/* Toggle Buttons */}
      <div className="flex w-full gap-0">
        <button
          onClick={() => setActiveTab('NUTRIENTS')}
          className={`flex-1 border-4 border-black p-4 font-black text-lg md:text-xl uppercase transition-all ${
            activeTab === 'NUTRIENTS' 
              ? 'bg-black text-white translate-x-[2px] translate-y-[2px]' 
              : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:-translate-x-[1px]'
          }`}
        >
          NUTRIENTS
        </button>
        <button
          onClick={() => setActiveTab('INGREDIENTS')}
          className={`flex-1 border-4 border-black border-l-0 p-4 font-black text-lg md:text-xl uppercase transition-all ${
            activeTab === 'INGREDIENTS' 
              ? 'bg-black text-white translate-x-[2px] translate-y-[2px]' 
              : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:-translate-x-[1px]'
          }`}
        >
          INGREDIENTS
        </button>
      </div>

      {/* Conditional Content */}
      <div className="min-h-[300px]">
        {activeTab === 'NUTRIENTS' ? (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Macros */}
            <div className="grid grid-cols-2 gap-4">
              <NeoCard className="bg-[#FF914D]" title="SUGAR">
                 <div className="text-4xl lg:text-5xl font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] break-all">
                   {report.sugar_g !== null && report.sugar_g !== undefined ? `${report.sugar_g}g` : 'N/A'}
                 </div>
                 <p className="font-bold text-xs mt-2 uppercase">Per Serving</p>
              </NeoCard>
              <NeoCard className="bg-[#CB6CE6]" title="PROTEIN">
                 <div className="text-4xl lg:text-5xl font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] break-all">
                   {report.protein_g !== null && report.protein_g !== undefined ? `${report.protein_g}g` : 'N/A'}
                 </div>
                 <p className="font-bold text-xs mt-2 uppercase">Per Serving</p>
              </NeoCard>
            </div>

            {/* Analysis */}
            <NeoCard className="bg-[#7ED957]" title="THE TRUTH">
              <p className="font-bold text-lg leading-relaxed">
                {report.nutritional_analysis}
              </p>
            </NeoCard>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <NeoCard className="bg-white" title="DECONSTRUCTED">
               <div className="flex flex-col gap-3">
                 {report.ingredients && report.ingredients.length > 0 ? (
                    report.ingredients.map((ing, idx) => {
                      let tagColor = 'bg-[#7ED957]'; // Safe
                      let borderColor = 'border-black';
                      if (ing.risk === 'DANGER') {
                        tagColor = 'bg-[#FF5757] text-white';
                        borderColor = 'border-[#FF5757]';
                      } else if (ing.risk === 'CAUTION') {
                        tagColor = 'bg-[#FFDE59]';
                      }

                      return (
                        <div key={idx} className={`border-b-4 ${borderColor} pb-3 last:border-b-0`}>
                           <div className="flex justify-between items-start gap-2">
                              <span className="font-bold uppercase text-sm md:text-base leading-tight">{ing.name}</span>
                              <span className={`flex-shrink-0 ${tagColor} border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase`}>
                                {ing.risk}
                              </span>
                           </div>
                           {(ing.risk === 'DANGER' || ing.risk === 'CAUTION') && ing.reason && (
                             <p className="text-xs font-mono mt-1 opacity-70 border-l-2 border-black pl-2 ml-1">
                               {ing.reason}
                             </p>
                           )}
                        </div>
                      );
                    })
                 ) : (
                   <p className="font-mono text-center p-4">NO INGREDIENT DATA AVAILABLE.</p>
                 )}
               </div>
            </NeoCard>
          </div>
        )}
      </div>

      <NeoButton onClick={onReset} className="w-full text-xl py-6" variant="primary">
        SCAN ANOTHER ONE
      </NeoButton>
    </div>
  );
};

export default ReportCard;