<script lang="ts">
	import UpdateEmailModal from '$lib/components/modal/UpdateEmailModal.svelte';
	import UpdateNameModal from '$lib/components/modal/UpdateNameModal.svelte';
	import UpdateNumberModal from '$lib/components/modal/UpdateNumberModal.svelte';
	import UpdatePasswordModal from '$lib/components/modal/UpdatePasswordModal.svelte';

	import { Button } from '$lib/components/ui/button';
	import {
		updateEmailModalState,
		updateNumberModalState,
		updateNameModalState,
		updatePasswordModalState
	} from '$lib/states/modalState.svelte';
</script>

<div class="m-auto flex w-full max-w-[900px] flex-col gap-5 px-2 md:px-10">
	<div class="flex w-full justify-between gap-5 border-b pb-3">
		<p class="text-base font-semibold md:text-lg">Email</p>
		<Button
			variant="link"
			onclick={() => updateEmailModalState.setTrue()}
			class="text-base font-normal md:text-lg"
			>Change Email
		</Button>
		<UpdateEmailModal />
	</div>

	<div class="flex w-full justify-between gap-5 border-b pb-3">
		<p class="text-base font-normal md:text-lg">Mobile number</p>
		<Button
			variant="link"
			onclick={() => updateNumberModalState.setTrue()}
			class="text-base font-normal md:text-lg"
			>Change Number
		</Button>
		<UpdateNumberModal />
	</div>

	<div class="flex w-full justify-between gap-5 border-b pb-3">
		<p class="text-base font-normal md:text-lg">Name</p>
		<UpdateNameModal />
		<Button
			variant="link"
			onclick={() => updateNameModalState.setTrue()}
			class="text-base font-normal md:text-lg"
			>Change Name
		</Button>
	</div>
	<div class="flex w-full justify-between gap-5 border-b pb-3">
		<p class="text-base font-normal md:text-lg">Password</p>

		<UpdatePasswordModal />
		<Button
			variant="link"
			onclick={() => updatePasswordModalState.setTrue()}
			class="text-base font-normal md:text-lg"
			>Change Password
		</Button>
	</div>

	<div class="flex w-full justify-between gap-5 border-b pb-3">
		<p class="text-base font-normal md:text-lg">Log out african market online</p>
		<Button variant="link">Logout</Button>
	</div>
</div>
