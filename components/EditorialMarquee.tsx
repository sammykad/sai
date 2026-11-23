const ITEMS = [
  "Contextual Innovation",
  "Functional Craftsmanship",
  "Purposeful Sustainability",
  "Solapur",
  "Pune",
  "Chh. Sambhajinagar",
  "Maharashtra",
];

const Row = () => (
  <div className="flex shrink-0 items-center">
    {ITEMS.map((item, i) => (
      <span key={i} className="flex items-center">
        <span className="ff-serif italic text-2xl sm:text-3xl text-[#C8A97E]/40 whitespace-nowrap px-8">
          {item}
        </span>
        <span className="w-1.5 h-1.5 rotate-45 bg-[#C8A97E]/30" />
      </span>
    ))}
  </div>
);

const EditorialMarquee = () => (
  <div
    className="relative border-y border-white/10 bg-[#0C0D11] py-7 overflow-hidden"
    data-testid="editorial-marquee"
  >
    <div className="animate-marquee flex w-max">
      <Row />
      <Row />
    </div>
  </div>
);

export default EditorialMarquee;
