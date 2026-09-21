export default function Loading() {
  return (
    <div className="fixed inset-x-0 top-0 z-[1600] h-1 overflow-hidden bg-primary/10">
      <div className="h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] bg-primary" />
    </div>
  );
}
