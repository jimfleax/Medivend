import React from 'react';

interface GraphicProps {
  className?: string;
}

export const PharmacyShopGraphic: React.FC<GraphicProps> = ({
  className = 'w-28 h-28 text-primary',
}) => (
  <svg
    viewBox="0 0 160 160"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Storefront Roof / Awning */}
    <path
      d="M24 44L34 26H126L136 44H24Z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Awning Stripes */}
    <path d="M48 26L42 44M70 26L68 44M90 26L92 44M112 26L118 44" stroke="currentColor" strokeWidth="2" />

    {/* Awning Scallop Trim */}
    <path
      d="M24 44C27 48 31 48 34 44C37 48 41 48 44 44C47 48 51 48 54 44C57 48 61 48 64 44C67 48 71 48 74 44C77 48 81 48 84 44C87 48 91 48 94 44C97 48 101 48 104 44C107 48 111 48 114 44C117 48 121 48 124 44C127 48 131 48 136 44"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Store Main Building Body */}
    <rect x="30" y="48" width="100" height="96" rx="4" fill="#F8FAFC" stroke="currentColor" strokeWidth="3.5" />

    {/* Pharmacy Glowing Signboard with Cross */}
    <rect x="52" y="56" width="56" height="18" rx="4" fill="currentColor" stroke="currentColor" strokeWidth="2" />
    <path d="M80 60V70M75 65H85" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

    {/* Left Display Window */}
    <rect x="38" y="82" width="34" height="48" rx="4" fill="#FFFFFF" stroke="currentColor" strokeWidth="2.5" />
    <line x1="40" y1="102" x2="70" y2="102" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
    <rect x="44" y="90" width="7" height="10" rx="1.5" fill="currentColor" fillOpacity="0.7" />
    <rect x="55" y="88" width="11" height="12" rx="2" fill="currentColor" fillOpacity="0.4" />
    <rect x="46" y="108" width="10" height="14" rx="2" fill="currentColor" fillOpacity="0.5" />
    <rect x="60" y="110" width="8" height="12" rx="1.5" fill="currentColor" fillOpacity="0.8" />

    {/* Right Storefront Glass Door */}
    <rect x="80" y="82" width="42" height="62" rx="4" fill="#FFFFFF" stroke="currentColor" strokeWidth="2.5" />
    <rect x="86" y="88" width="30" height="36" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
    <line x1="88" y1="112" x2="88" y2="124" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
