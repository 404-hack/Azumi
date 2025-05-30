<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import * as InputOTP from '$lib/components/ui/input-otp';
	import { Loader2 } from 'lucide-svelte';
	import { verifyOtpModalState } from '$lib/states/modalState.svelte';
	import ResponsiveDialog from '../ResponsiveDialog.svelte';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { z } from 'zod';
	import { zod } from 'sveltekit-superforms/adapters';
	import ProfileSetupModal from './ProfileSetupModal.svelte';
	import { profileSetupModalState } from '$lib/states/modalState.svelte';
	import { onMount } from 'svelte';

	type Props = {
		title?: string;
		phoneNumber?: string;
	};

	const otpSchema = z.object({
		otp: z.string().length(6, 'OTP must be 6 digits')
	});
	let { title, phoneNumber }: Props = $props();

	let otpInputRef = $state<HTMLElement>();

	let countdown = $state(50);
	let canResend = $state(false);
	let intervalId: ReturnType<typeof setInterval>;

	function startCountdown() {
		canResend = false;
		countdown = 50;
		clearInterval(intervalId);
		intervalId = setInterval(() => {
			if (countdown > 0) {
				countdown--;
			} else {
				canResend = true;
				clearInterval(intervalId);
			}
		}, 1000);
	}
	$effect(() => {
		if (verifyOtpModalState.value) {
			startCountdown();
			setTimeout(() => {
				// if (otpInputRef) {
				// 	const firstInput = otpInputRef.querySelector('input');
				// 	if (firstInput) {
				// 		firstInput.focus();
				// 	}
				// }
			}, 100);
		}
		return () => clearInterval(intervalId);
	});

	const form = superForm(defaults(zod(otpSchema)), {
		validators: zod(otpSchema),
		SPA: true,
		onUpdate: async ({ form }) => {
			if (form.valid) {
				try {
					// Verify phone number
					await authClient.phoneNumber.verify(
						{
							phoneNumber: phoneNumber || '',
							code: form.data.otp
						},
						{
							async onSuccess(data) {
								// Check if this is a new user (using the data from verify response)
								// Typically there would be an isNewUser flag or we can check fields
								// that are only set for existing users

								const session = await authClient.getSession();
								const user = session.data?.user;

								// If the user's name is the same as their phone number, they're new
								// This relies on the getTempName function we set in auth.ts
								const isNewUser = user && user.name === phoneNumber;
								if (isNewUser) {
									// For new users, show profile setup modal
									verifyOtpModalState.setFalse();
									setTimeout(() => {
										profileSetupModalState.setTrue();
									}, 100);
									toast.success('Phone verified! Please complete your profile.');
								} else {
									// For existing users, just close modal and show success
									verifyOtpModalState.setFalse();
									toast.success('Logged in successfully!');
								}
							},
							onError(ctx) {
								toast.error(ctx.error.message || 'Verification failed');
							}
						}
					);
				} catch (error) {
					console.error('Unexpected error:', error);
					toast.error('An unexpected error occurred');
				}
			}
		}
	});
	const { form: formData, enhance, delayed } = form;
</script>

<ResponsiveDialog
	bind:open={verifyOtpModalState.value}
	title={title || 'Verify your phone number'}
	description="Please enter the 6-digit code sent to your phone."
	interactOutsideBehavior="ignore"
>
	<form method="POST" class="mt-3 flex flex-col items-center space-y-4" use:enhance>
		<Form.Field {form} name="otp" class="w-full">
			<Form.Control>
				{#snippet children({ props })}
					<InputOTP.Root
						
						maxlength={6}
						bind:value={$formData.otp}
						class="flex items-center justify-center gap-2"
						type="tel"
						inputmode="numeric"
						pattern="[0-9]*"
						autocomplete="one-time-code"
					>
						{#snippet children({ cells })}
							<InputOTP.Group>
								{#each cells.slice(0, 3) as cell}
									<InputOTP.Slot
										{cell}
										class="h-10 w-10 rounded-md border border-input bg-background text-center text-lg shadow-sm transition-all duration-150 invalid:border-red-500 focus:border-primary focus:ring-1 focus:ring-primary"
									/>
								{/each}
							</InputOTP.Group>
							<InputOTP.Separator class="text-muted-foreground">-</InputOTP.Separator>
							<InputOTP.Group>
								{#each cells.slice(3) as cell}
									<InputOTP.Slot
										{cell}
										class="h-10 w-10 rounded-md border border-input bg-background text-center text-lg shadow-sm transition-all duration-150 invalid:border-red-500 focus:border-primary focus:ring-1 focus:ring-primary"
									/>
								{/each}
							</InputOTP.Group>
						{/snippet}
					</InputOTP.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<div class="flex flex-col items-center gap-2">
			{#if !canResend}
				<p class="text-sm text-muted-foreground">
					Didn't receive the code? Resend in {countdown}s
				</p>
			{:else}
				<button
					type="button"
					class="text-sm text-primary hover:underline"
					onclick={() => {
						authClient.phoneNumber.sendOtp({
							phoneNumber: phoneNumber || ''
						});
						toast.success('New OTP code sent');
						startCountdown();
					}}
				>
					Resend code
				</button>
			{/if}
		</div>

		<Form.Button disabled={$delayed} class="mt-2 w-full max-w-[300px]">
			{#if $delayed}
				<Loader2 class="h-6 w-6 animate-spin" />
			{:else}
				Verify
			{/if}
		</Form.Button>
	</form>
</ResponsiveDialog>

<!-- Show the ProfileSetupModal only for new users after verification -->
<ProfileSetupModal />
