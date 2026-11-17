import React from 'react';

interface GraphicProps {
  className?: string;
}

export const VendingMachineGraphic: React.FC<GraphicProps> = ({
  className = 'w-28 h-28 text-primary',
}) => (
  <svg
    viewBox="0 0 160 160"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Machine Cabinet Outer Frame */}
    <rect x="30" y="16" width="100" height="132" rx="14" fill="#F8FAFC" stroke="currentColor" strokeWidth="3.5" />
    
    {/* Top Header Sign with glowing Cross */}
    <rect x="42" y="24" width="76" height="22" rx="6" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="2" />
    {/* Medical Cross in Header */}
    <path d="M80 29V41M74 35H86" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

    {/* Front Glass Display Window */}
    <rect x="42" y="52" width="54" height="52" rx="6" fill="#FFFFFF" stroke="currentColor" strokeWidth="2.5" />
    
    {/* Shelves & Medicine Packs inside Glass */}
    <line x1="44" y1="68" x2="94" y2="68" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.5" />
    <line x1="44" y1="86" x2="94" y2="86" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.5" />

    {/* Medicine Boxes / Bottles on shelves */}
    <rect x="48" y="58" width="10" height="8" rx="2" fill="currentColor" fillOpacity="0.8" />
    <rect x="63" y="57" width="12" height="9" rx="2" fill="currentColor" fillOpacity="0.4" />
    <rect x="80" y="58" width="10" height="8" rx="2" fill="currentColor" fillOpacity="0.7" />

    <rect x="48" y="74" width="12" height="10" rx="2" fill="currentColor" fillOpacity="0.5" />
    <rect x="66" y="75" width="9" height="9" rx="2" fill="currentColor" fillOpacity="0.8" />
    <rect x="81" y="74" width="11" height="10" rx="2" fill="currentColor" fillOpacity="0.4" />

    <rect x="52" y="92" width="10" height="9" rx="2" fill="currentColor" fillOpacity="0.7" />
    <rect x="68" y="91" width="12" height="10" rx="2" fill="currentColor" fillOpacity="0.6" />

    {/* Digital Control Panel & Scanner Column */}
    <rect x="102" y="52" width="16" height="24" rx="4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" />
    <circle cx="110" cy="60" r="2.5" fill="currentColor" />
    <circle cx="107" cy="68" r="1" fill="currentColor" />
    <circle cx="113" cy="68" r="1" fill="currentColor" />
    <circle cx="107" cy="72" r="1" fill="currentColor" />
    <circle cx="113" cy="72" r="1" fill="currentColor" />

    {/* Card Tap / Cash Slot */}
    <rect x="103" y="82" width="14" height="4" rx="1.5" fill="currentColor" />

    {/* Dispensing Tray Chamber at Bottom */}
    <rect x="42" y="112" width="76" height="26" rx="6" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2.5" />
    <rect x="54" y="121" width="52" height="9" rx="3" fill="#FFFFFF" stroke="currentColor" strokeWidth="2" />
    <line x1="72" y1="117" x2="88" y2="117" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
