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

// New DeleteModalState class with additional properties
class DeleteModalState extends ModalState {
	public itemName = $state<string | undefined>(undefined);
	public loading = $state<boolean>(false);
	public handleConfirm = $state<(() => void) | undefined>(undefined);

	// Open modal with specified parameters
	openDelete(params: { itemName?: string; loading?: boolean; handleConfirm: () => void }) {
		this.itemName = params.itemName;
		this.loading = params.loading || false;
		this.handleConfirm = params.handleConfirm;
		this.setTrue();
	}

	// Reset state when closing
	close() {
		this.itemName = undefined;
		this.loading = false;
		this.handleConfirm = undefined;
		this.setFalse();
	}

	// Update loading state
	setLoading(isLoading: boolean) {
		this.loading = isLoading;
	}
}

// Create interfaces that match our mapped database schema
export interface OptionItem {
	id: string;
	name: string;
	price: number;
	inStock?: boolean;
	shopId?: string;
	optionGroupId?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface OptionGroup {
	id: string;
	name: string;
	minSelections: number; // Required minimum selections
	maxSelections: number | null; // null means unlimited
	options: OptionItem[]; // Direct array of options
	// An option group is multiple if maxSelections > 1 or null (unlimited)
	get multiple(): boolean;
}

export interface MenuItem {
	id: string;
	name: string;
	description?: string;
	image: string | null;
	price: number;
	priceDescription?: string;
	inStock?: boolean;
	categoryId?: string;
	shopId?: string;
	optionGroups: OptionGroup[]; // Direct array of option groups
	packId?: string | null;
	createdAt?: string;
	updatedAt?: string;
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
	// Add description if it's missing from MenuItem but needed
	description?: string;
}

// Interface for a single selected option within a cart item
// Matches the structure observed in the shopCart data
export interface SelectedCartOption {
	option: {
		id: string;
		name: string;
		price: number;
	};
	optionGroup: {
		id: string;
		name: string;
	};
	quantity: number; // Usually 1 for selected options, but included for completeness
}

// Interface for the data specific to the cart item being edited
// Used to pre-populate the modal when editing
export interface CartItemEditContext {
	cartItemId: string;
	initialQuantity: number;
	initialSpecialInstructions: string;
	initialSelectedOptions: SelectedCartOption[]; // Use the detailed interface
}

// Interface representing the full product data needed by the modal
// This includes the base menu item details and all its available option groups
export interface ProductDataForModal extends MenuItem {
	// MenuItem already includes optionGroups, but ensure it's populated correctly
	// If MenuItem definition changes, adjust here.
}

class ProductModalState extends ModalState {
	// Holds the full product data (including all available options)
	// This is set regardless of whether adding or editing
	public productData = $state<ProductDataForModal | null>(null);

	// Holds the specific context of the cart item being edited, if any
	public editContext = $state<CartItemEditContext | null>(null);

	// Unified method to open the modal
	// Pass the full product data.
	// Pass editContext only when editing an existing cart item.
	openModal(product: ProductDataForModal, editContext?: CartItemEditContext) {
		// Log for debugging purposes
		console.log('Opening ProductModal...');
		console.log('Product Data:', product);
		if (editContext) {
			console.log('Edit Context:', editContext);
		} else {
			console.log('Mode: Adding new item');
		}

		// Basic validation: Ensure product data is provided
		if (!product) {
			console.error('ProductModalState: Cannot open modal without product data.');
			return;
		}
		// Ensure product data includes option groups if expected
		if (!product.optionGroups) {
			console.warn('ProductModalState: Product data is missing optionGroups.', product);
			// Assign empty array if missing, though ideally the source should provide it
			product.optionGroups = [];
		}

		this.productData = product;
		this.editContext = editContext || null; // Set edit context if provided, otherwise null
		this.setTrue(); // Open the modal (sets value = true)
	}

	close() {
		// Reset state completely when closing
		this.productData = null;
		this.editContext = null;
		this.setFalse(); // Close the modal (sets value = false)
		console.log('ProductModal closed and state reset.');
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
export const verifyOtpModalState = new ModalState(false);
export const profileSetupModalState = new ModalState(false);
export const requestPasswordResetModalState = new ModalState(false);
export const confirmEmailModalState = new ModalState(false);
export const deleteModalState = new DeleteModalState(false);
export const inviteUserModalState = new ModalState(false);
