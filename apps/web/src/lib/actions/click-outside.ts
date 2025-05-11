interface ClickOutsideOptions {
	handleClickOutside: () => void;
}

export function clickOutside(
	node: HTMLElement,
	options: ClickOutsideOptions
): { destroy: () => void } {
	const handleClick = (event: MouseEvent) => {
		if (!node.contains(event.target as Node)) {
			options.handleClickOutside();
		}
	};

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}
