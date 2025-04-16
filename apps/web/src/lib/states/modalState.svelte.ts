class ModalState {
	public value = $state<boolean>();
	constructor(modalState: boolean) {
		this.value = modalState;
	}
	setTrue() {
		this.value = true;
	}
	setFalse() {
		this.value = false;
	}

	toggleModal() {
		this.value = !this.value;
	}
}

// Create interfaces that match our database schema
export interface OptionItem {
	id: string;
	name: string;
	price: number;
	inStock: boolean;
	shopId: string;
	createdAt: string;
	updatedAt: string;
}

export interface OptionsToOptionGroups {
	option: OptionItem;
}

export interface OptionGroup {
	id: string;
	name: string;
	minSelections: number; // Required minimum selections
	maxSelections: number | null; // null means unlimited
	optionsToOptionGroups: OptionsToOptionGroups[];
	// An option group is multiple if maxSelections > 1 or null (unlimited)
	get multiple(): boolean;
}

export interface MenuItemOptionGroup {
	optionGroup: OptionGroup;
}

export interface MenuItem {
	id: string;
	name: string;
	description: string;
	image: string | null;
	price: number;
	priceDescription: string;
	inStock: boolean;
	categoryId: string;
	shopId: string;
	menuItemOptionGroups: MenuItemOptionGroup[];
	packId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface MenuCategory {
	id: string;
	name: string;
	published: boolean;
	shopId: string;
	menus: MenuItem[];
	createdAt: string;
	updatedAt: string;
}

export interface Restaurant {
	id: string;
	name: string;
	description: string;
	logo: string | null;
	coverImage: string | null;
	email: string;
	phoneNumber: number;
	address: string;
	coordinates: {
		lat: number;
		lng: number;
		name: string;
		address: string;
	};
	shopType: string;
	active: boolean;
	isVerified: boolean;
	menuCategories: MenuCategory[];
	deliveryType: string | null;
	minimumOrderAmount: number;
	operatingHours: any[]; // Can be typed more specifically if needed
	commission: number;
	slug: string;
	status: string;
	totalRatings: number;
	averageRating: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface ProductData extends MenuItem {
	category?: string;
}

export interface OptionSelection {
	groupId: string;
	selections: string[]; // Array of selected option IDs
	valid: boolean;
	error?: string;
}

class ProductModalState extends ModalState {
	public productData = $state<ProductData | null>(null);
	public optionSelections = $state<Record<string, OptionSelection>>({});

	openWithProduct(product: ProductData) {
		this.productData = product;
		this.setTrue();
	}

	close() {
		this.setFalse();
	}
}

export const addCategoryModalState = new ModalState(false);
export const addPackModalState = new ModalState(false);
export const addOptionGroupModalState = new ModalState(false);
export const addOptionModalState = new ModalState(false);
export const productModalState = new ProductModalState(false);
export const cartsSheetStore = new ModalState(false);
export const cartSheetState = new ModalState(false);
export const updateEmailModalState = new ModalState(false);
export const updateNumberModalState = new ModalState(false);
export const updateNameModalState = new ModalState(false);
export const updatePasswordModalState = new ModalState(false);
export const addAddressModalState = new ModalState(false);
export const deliveryAddressModalState = new ModalState(false);
export const addDeliveryAddressModalState = new ModalState(false);
export const loginModalState = new ModalState(false);
export const registerModalState = new ModalState(false);
export const requestPasswordResetModalState = new ModalState(false);
export const confirmEmailModalState = new ModalState(false);
export const deleteModalState = new ModalState(false);
export const inviteUserModalState = new ModalState(false);
