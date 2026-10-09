interface AvatarProps {
  name: string
}

export const Avatar = ({ name }: AvatarProps) => {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal-soft text-sm font-semibold text-brand-teal">
      {initials}
    </span>
  )
}
