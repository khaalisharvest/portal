// Server component — no JS sent to client, CSS animation only
export default function Hero() {
  return (
    <div className="container-custom pt-12 pb-8 sm:pt-16 sm:pb-10 flex flex-col items-center text-center animate-fadeInUp">

      {/* Brand headline — Playfair Display for organic warmth */}
      <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-700 tracking-tight mb-4 drop-shadow-sm leading-[1.1]">
        <span className="text-primary-600 italic">Khaalis</span>
        {' '}
        <span className="text-neutral-900">Harvest</span>
      </h1>

      {/* Value proposition — benefit, not a category claim */}
      <p className="text-lg sm:text-xl font-medium text-neutral-600 tracking-wide max-w-md leading-relaxed">
        Pure, farm-sourced food — no additives, no adulteration.
        <span className="block text-sm text-neutral-400 mt-1 font-normal">Delivered fresh across Punjab.</span>
      </p>

    </div>
  );
}
