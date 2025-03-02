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

export const addCategoryModalState = new ModalState(false);
export const addPackModalState = new ModalState(false);
export const addOptionGroupModalState = new ModalState(false);
export const productModalState = new ModalState(false);
export const orderSheetStore = new ModalState(false);
export const updateEmailModalState = new ModalState(false);
export const updateNumberModalState = new ModalState(false);
export const updateNameModalState = new ModalState(false);
export const updatePasswordModalState = new ModalState(false);
export const addAddressModalState = new ModalState(false);
export const loginModalState = new ModalState(false);
export const registerModalState = new ModalState(false);
export const requestPasswordResetModalState = new ModalState(false);
export const confirmEmailModalState = new ModalState(false);
