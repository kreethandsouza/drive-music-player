export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-white/10 px-4 pt-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`relative px-3 py-2 text-sm font-medium transition ${
            active === tab.id ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          {tab.label}
          {active === tab.id && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-emerald-500" />}
        </button>
      ))}
    </div>
  )
}
