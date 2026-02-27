import { TIME_RANGE_OPTIONS } from '../../lib/query';

interface TimeRangeSelectorProps {
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
  label?: string | null;
  className?: string;
  compact?: boolean;
}

export default function TimeRangeSelector({
  value,
  onChange,
  disabled = false,
  label = 'History',
  className,
  compact = false,
}: TimeRangeSelectorProps) {
  return (
    <div className={className}>
      {label ? <label className="form-label small text-body-secondary mb-1">{label}</label> : null}
      <div
        className={`btn-group d-flex range-group${compact ? ' range-group--compact' : ''}`}
        role="group"
        aria-label="History range selector"
      >
        {TIME_RANGE_OPTIONS.map((option) => (
          <button
            key={option.minutes}
            type="button"
            className={`btn btn-sm range-btn ${value === option.minutes ? 'range-btn-active' : ''}`}
            onClick={() => onChange(option.minutes)}
            disabled={disabled}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
