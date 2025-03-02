export interface ProductVariant {
	id: string;
	name: string;
	price: number;
}

export interface ProductCategory {
	id: string;
	name: string;
	variants: ProductVariant[];
	multiSelect?: boolean;
}

export interface Product {
	id: string;
	name: string;
	description: string;
	image: string;
	price: number;
	categories: ProductCategory[];
}
