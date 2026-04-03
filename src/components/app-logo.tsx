export default function AppLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="26" r="15" stroke="currentColor" strokeWidth="1" strokeDasharray="2.5 2.5" opacity="0.4" />
      <circle cx="26" cy="26" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <circle cx="26" cy="26" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="26" cy="26" r="2.5" fill="currentColor" />
    </svg>
  );
}
