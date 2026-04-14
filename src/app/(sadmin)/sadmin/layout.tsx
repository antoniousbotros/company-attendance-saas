export default function SadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {children}
    </div>
  );
}
