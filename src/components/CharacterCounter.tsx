export default function CharacterCounter({ value, max, warnThreshold }: { value: string; max: number; warnThreshold?: number }) {
	return <span className={warnThreshold !== undefined && value.length >= warnThreshold ? "text-amber-600" : undefined}>{value.length}/{max}</span>;
}
