export default function SignumLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* S icon */}
      <rect x="0" y="4" width="44" height="44" rx="8" fill="#D41317"/>
      <path
        d="M28 14H16a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H14"
        stroke="white" strokeWidth="3.5" strokeLinecap="round"
      />
      {/* Signum text */}
      <text x="54" y="34" fontFamily="Georgia, serif" fontSize="26" fontWeight="700" fill="#D41317">Signum</text>
    </svg>
  )
}
