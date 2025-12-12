import React, { useEffect, useRef } from 'react';
import { NeoCard } from './NeoComponents';

interface SearchWidgetProps {
  cseId: string;
}

const SearchWidget: React.FC<SearchWidgetProps> = ({ cseId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cleanup previous script if any to prevent duplicates
    const existingScript = document.getElementById('cse-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Inject script
    const script = document.createElement('script');
    script.src = `https://cse.google.com/cse.js?cx=${cseId}`;
    script.async = true;
    script.id = 'cse-script';
    document.body.appendChild(script);

    return () => {
      // Optional cleanup on unmount
      // Note: Google CSE leaves some global pollution, hard to fully clean without reload
    };
  }, [cseId]);

  return (
    <NeoCard title="MANUAL RECON" className="w-full bg-[#CB6CE6]">
      <p className="mb-4 font-bold text-sm">
        CAN'T SCAN? SEARCH IT. COPY THE TEXT. FEED THE AI.
      </p>
      <div className="bg-white border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[200px]">
         <div className="gcse-search"></div>
      </div>
    </NeoCard>
  );
};

export default SearchWidget;