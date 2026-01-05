import { METERS_PER_MILE, MIN_RADIUS_METERS, MAX_RADIUS_METERS } from '@/utils/constants'

interface RadiusSliderProps {
  value: number // in meters
  onChange: (value: number) => void
}

export function RadiusSlider({ value, onChange }: RadiusSliderProps) {
  const miles = value / METERS_PER_MILE

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Discovery Radius</span>
        <span className="font-medium">{miles.toFixed(2)} miles</span>
      </div>
      <input
        type="range"
        min={MIN_RADIUS_METERS}
        max={MAX_RADIUS_METERS}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>~150ft</span>
        <span>1 mile</span>
      </div>
    </div>
  )
}
