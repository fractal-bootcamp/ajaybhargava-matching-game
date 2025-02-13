// Import all SVG files from the assets directory dynamically
const cardImages = import.meta.glob("../assets/*.svg", { eager: true });

interface CardImageProps {
	card: string; // e.g., "2C", "KH", etc.
	alt?: string;
	className?: string;
}
export function CardImage({
	card,
	alt,
	className = "w-24 h-auto",
}: CardImageProps) {
	const imagePath = `../assets/${card}.svg`;
	const imageModule = cardImages[imagePath] as { default: string };

	return (
		<img
			src={imageModule.default}
			alt={alt || `${card} card`}
			className={className}
		/>
	);
}
