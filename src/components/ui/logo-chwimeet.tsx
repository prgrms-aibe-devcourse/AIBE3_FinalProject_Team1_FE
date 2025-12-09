"use client";

interface LogoChwimeetProps {
  className?: string;
  width?: number;
  height?: number;
}

export function LogoChwimeet({
  className,
  width = 160,
  height = 32,
}: LogoChwimeetProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 320 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text
        x="0"
        y="44"
        fill="#0F172A"
        fontSize="40"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
      >
        CHWI
      </text>
      <text
        x="120"
        y="44"
        fill="#2563EB"
        fontSize="40"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
      >
        MEET
      </text>
    </svg>
  );
}

