<script>
	import { UserPlus } from 'lucide-svelte';
	import { inviteUserModalState } from '$lib/states/modalState.svelte';
	import InviteUserModal from './modal/InviteUserModal.svelte';
	import { Button } from '$lib/components/ui/button';

	function inviteUser() {
		inviteUserModalState.setTrue();
	}
</script>

<Button onclick={inviteUser}>
	<UserPlus class="mr-2 h-4 w-4" />
	Invite User
</Button>

<InviteUserModal />
