export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  helper = "",
  min,
  max,
  step,
  disabled = false
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        disabled={disabled}
        max={max}
        min={min}
        placeholder={placeholder}
        step={step}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {helper ? <small className="field-helper">{helper}</small> : null}
    </label>
  );
}

export function Textarea({ label, value, onChange, rows = 4, placeholder = "", helper = "" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {helper ? <small className="field-helper">{helper}</small> : null}
    </label>
  );
}

export function Select({ label, value, options, onChange, renderLabel, helper = "", disabled = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {renderLabel ? renderLabel(option) : option}
          </option>
        ))}
      </select>
      {helper ? <small className="field-helper">{helper}</small> : null}
    </label>
  );
}
