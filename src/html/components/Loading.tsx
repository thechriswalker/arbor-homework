export default function Loading() {
  return (
    <div class="loading loading03">
      {"loading".split("").map((c) => (
        <span>{c}</span>
      ))}
    </div>
  );
}
