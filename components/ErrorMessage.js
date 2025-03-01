export default function ErrorMessage({ message, className = '' }) {
  return (
    <div className={`p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg ${className}`}>
      <p className="text-sm">{message}</p>
    </div>
  );
}
