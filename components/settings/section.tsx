export function SettingsSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-5 rounded-card border-2 bg-card p-5"
    >
      <h2 id={id} className="text-section">
        {title}
      </h2>
      {children}
    </section>
  );
}
