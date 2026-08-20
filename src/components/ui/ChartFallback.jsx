/**
 * Grafik yuklanguncha turadigan o'rin.
 *
 * "Grafik yuklanmoqda..." matni o'rniga grafikning shakli ko'rsatiladi:
 * tarkib kelganda maket sakramaydi va kutish qisqaroq tuyuladi.
 */
export default function ChartFallback({ height = 260 }) {
  const bars = [45, 70, 38, 82, 56, 64, 48];

  return (
    <div
      className="flex items-end gap-2 px-1 pb-6"
      style={{ height }}
      aria-busy="true"
      aria-label="Grafik yuklanmoqda"
    >
      {bars.map((value, index) => (
        <div
          key={index}
          className="skeleton flex-1 rounded-sm"
          style={{ height: `${value}%` }}
        />
      ))}
    </div>
  );
}
