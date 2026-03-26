import { type SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  filled?: boolean
}

export function MapIcon({ filled = false, ...props }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {filled ? (
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
          fill="currentColor"
        />
      ) : (
        <>
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="9"
            r="2.5"
            stroke="currentColor"
            strokeWidth="2"
          />
        </>
      )}
    </svg>
  )
}

export function PeopleIcon({ filled = false, ...props }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {filled ? (
        <path
          d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
          fill="currentColor"
        />
      ) : (
        <>
          <circle
            cx="9"
            cy="7"
            r="3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="17"
            cy="7"
            r="2.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M3 19v-1.5C3 15.01 6.58 13 9 13s6 2.01 6 4.5V19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M15 13.5c1.5 0 5 1 5 3.5v2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}

export function RankIcon({ filled = false, ...props }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {filled ? (
        <>
          <rect x="2" y="13" width="5" height="9" rx="1.5" fill="currentColor" />
          <rect x="9.5" y="8" width="5" height="14" rx="1.5" fill="currentColor" />
          <rect x="17" y="3" width="5" height="19" rx="1.5" fill="currentColor" />
          <circle cx="4.5" cy="10" r="2" fill="currentColor" />
          <circle cx="12" cy="5" r="2" fill="currentColor" />
          <circle cx="19.5" cy="1.5" r="1.5" fill="currentColor" />
        </>
      ) : (
        <>
          <rect x="2" y="13" width="5" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="9.5" y="8" width="5" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <rect x="17" y="3" width="5" height="19" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        </>
      )}
    </svg>
  )
}

export function PersonIcon({ filled = false, ...props }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {filled ? (
        <path
          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          fill="currentColor"
        />
      ) : (
        <>
          <circle
            cx="12"
            cy="8"
            r="3.5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M4 20v-1c0-2.76 4.03-5 8-5s8 2.24 8 5v1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}
