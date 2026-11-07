interface AvatarProps {
  name: string
  size?: number
}

const palette = [
  { bg: '#dbeafe', fg: '#2563eb' },
  { bg: '#ccfbf1', fg: '#0d9488' },
  { bg: '#fef3c7', fg: '#d97706' },
  { bg: '#ffe4e6', fg: '#e11d48' },
  { bg: '#ede9fe', fg: '#7c3aed' },
]

export const Avatar = ({ name, size = 36 }: AvatarProps) => {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const color = palette[name.length % palette.length]

  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, backgroundColor: color.bg, color: color.fg, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
}