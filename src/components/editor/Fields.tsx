import type { ReactNode } from "react"

export function NumberField({
  label,
  value,
  step = 0.1,
  onChange,
}: {
  label: string
  value: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="control-row">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="checkbox-row">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}

export function Vector3Field({
  title,
  labels,
  values,
  step = 0.1,
  onChange,
}: {
  title: string
  labels: [string, string, string]
  values: [number, number, number]
  step?: number
  onChange: (axis: "x" | "y" | "z", value: number) => void
}) {
  const axes: Array<"x" | "y" | "z"> = ["x", "y", "z"]

  return (
    <div className="vector3-block">
      <div className="vector3-title">{title}</div>
      <div className="vector3-field">
        {labels.map((label) => (
          <span key={label} className="vector3-label">
            {label}
          </span>
        ))}
        {values.map((value, index) => (
          <input
            key={axes[index] ?? index}
            type="number"
            value={value}
            step={step}
            onChange={(event) =>
              onChange(axes[index] ?? "x", Number(event.target.value))
            }
          />
        ))}
      </div>
    </div>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}) {
  return (
    <label className="control-row">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <details className="editor-card collapsible-section" open>
      <summary>{title}</summary>
      <div className="editor-card-header">
        {description ? <p>{description}</p> : null}
      </div>
      <div className="editor-grid">{children}</div>
    </details>
  )
}
