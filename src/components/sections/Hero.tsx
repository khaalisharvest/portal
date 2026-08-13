// Server component — no JS sent to client, CSS animation only
export default function Hero() {
  return (
    <div className="container-custom pt-12 pb-8 sm:pt-14 sm:pb-10 flex flex-col items-center text-center animate-fadeInUp">

      {/* Brand headline */}
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-4 drop-shadow-sm">
        <span className="text-primary-600">Khaalis</span>
        {' '}
        <span className="text-neutral-900">Harvest</span>
      </h1>

      {/* Tagline */}
      <p className="text-lg sm:text-xl lg:text-2xl font-medium text-neutral-600 tracking-wide">
        Pakistan's Premier Pure Organic Marketplace
      </p>

    </div>
  );
}
