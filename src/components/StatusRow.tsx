export type Tone = 'ok' | 'warn' | 'bad' | 'idle'

type Props = {
  label: string
  value: string
  tone: Tone
  hint?: string
}

export function StatusRow({ label, value, tone, hint }: Props) {
  return (
    <div className="row">
      <div className="row-main">
        <span className="row-label">{label}</span>
        <span className={`badge badge-${tone}`}>
          <span className="dot" aria-hidden="true" />
          {value}
        </span>
      </div>
      {hint ? <p className="row-hint">{hint}</p> : null}
    </div>
  )
}
