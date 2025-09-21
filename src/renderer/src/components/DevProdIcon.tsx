export interface DevprodIconProps {
  size?: number
  green?: string
  black?: string
  title?: string
  rounded?: number
  showBorder?: boolean
}
export interface DevprodLogoProps {
  width?: number
  height?: number
  green?: string
  black?: string
  title?: string
}

export function DevprodLogo({
  width = 360,
  height = 96,
  green = '#19C37D',
  black = 'oklch(43.2% 0.232 292.759)',
  title = 'devprod Logo'
}: DevprodLogoProps): React.ReactElement {
  return (
    <svg
      role="img"
      aria-label={title}
      width={width}
      height={height}
      viewBox="0 0 360 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icon: liegende Unendlichkeitsschleife */}
      <path
        d="M28 48
           C28 30, 48 30, 56 48
           C64 66, 84 66, 92 48
           C100 30, 80 30, 72 48
           C64 66, 44 66, 36 48"
        stroke={green}
        strokeWidth={10}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Wortmarke */}
      <g transform="translate(116, 22)">
        <text
          x="0"
          y="36"
          style={{
            fontFamily:
              'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            fontWeight: 700,
            fontSize: 36,
            letterSpacing: '0.3px'
          }}
          fill={black}
        >
          dev
          <tspan fill={green}>prod</tspan>
        </text>
      </g>
    </svg>
  )
}

/** Icon-only (quadratisch, ideal für Favicon/App-Icon) */
import React from 'react'

export function DevprodIcon({
  size = 120,
  green = '#19C37D',
  black = '#111111',
  title = 'devprod Icon',
  rounded = 16,
  showBorder = true
}: DevprodIconProps): React.ReactElement {
  return (
    <svg
      role="img"
      aria-label={title}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {showBorder && (
        <rect
          x={4.5}
          y={4.5}
          width={111}
          height={111}
          rx={rounded}
          fill="none"
          stroke={black}
          strokeWidth={3}
        />
      )}

      <path
        d="M20 60
           C20 44, 38 44, 45 60
           C52 76, 70 76, 77 60
           C84 44, 66 44, 59 60
           C52 76, 34 76, 27 60"
        stroke={green}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
