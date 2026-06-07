// SVG del escudo Carunchio-Péculo
export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Escudo base */}
      <path d="M60 8 L100 25 L100 70 Q100 95 60 112 Q20 95 20 70 L20 25 Z" fill="#8B6914" opacity="0.15"/>
      <path d="M60 12 L96 28 L96 70 Q96 92 60 108 Q24 92 24 70 L24 28 Z" fill="none" stroke="#8B6914" strokeWidth="1.5"/>
      {/* Corona */}
      <path d="M42 22 L48 16 L54 22 L60 14 L66 22 L72 16 L78 22" fill="none" stroke="#8B6914" strokeWidth="1.5" strokeLinecap="round"/>
      {/* CP monograma */}
      <text x="60" y="68" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontWeight="600" fill="#8B6914">CP</text>
      {/* Ramas decorativas */}
      <path d="M30 75 Q40 65 50 70" fill="none" stroke="#8B6914" strokeWidth="1" opacity="0.6"/>
      <path d="M90 75 Q80 65 70 70" fill="none" stroke="#8B6914" strokeWidth="1" opacity="0.6"/>
      {/* Base escudo */}
      <path d="M40 95 Q60 105 80 95" fill="none" stroke="#8B6914" strokeWidth="1" opacity="0.6"/>
    </svg>
  )
}
