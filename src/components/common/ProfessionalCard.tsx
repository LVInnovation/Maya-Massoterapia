interface Professional {
  id: string | number;
  name: string;
  specialty: string;
  image: string;
}

interface ProfessionalCardProps {
  professional: Professional;
  actionLabel: string;
  fallbackName: string;
  fallbackSpecialty: string;
  onViewSchedule: (professionalId: string | number) => void;
}

const ProfessionalCard = ({
  professional,
  actionLabel,
  fallbackName,
  fallbackSpecialty,
  onViewSchedule,
}: ProfessionalCardProps) => {
  const defaultImage =
    'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=500&fit=crop';

  return (
    <div className="group overflow-hidden rounded-3xl border border-gold-400/20 bg-dark-700 shadow-card transition-all duration-500 hover:border-gold-400/50 hover:shadow-hover">
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-dark-600 sm:h-56 md:h-64">
        <img
          src={professional.image || defaultImage}
          alt={professional.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/40 to-transparent opacity-100" />
      </div>

      <div className="p-6 text-center sm:p-6 md:p-7">
        <h3 className="mb-2 text-lg font-semibold text-gray-100 sm:text-xl font-serif">
          {professional.name || fallbackName}
        </h3>

        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold-400 sm:mb-5 sm:text-sm">
          {professional.specialty || fallbackSpecialty}
        </p>

        <button
          type="button"
          onClick={() => onViewSchedule(professional.id)}
          className="inline-flex items-center justify-center rounded-full bg-gold-400 px-6 py-2.5 text-xs font-semibold text-dark-900 transition-all duration-300 hover:bg-gold-300 hover:shadow-gold-glow sm:px-6 sm:text-sm"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default ProfessionalCard;
