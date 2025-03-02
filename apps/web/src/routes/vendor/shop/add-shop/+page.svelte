<script lang="ts">
  import { ArrowLeft, Camera } from 'lucide-svelte';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Form from '$lib/components/ui/form';
  import { defaults, superForm } from 'sveltekit-superforms';
  import { zod, zodClient } from 'sveltekit-superforms/adapters';
  import { createStoreSchema } from '$lib/formSchema';

  let logoPreview = $state<string | null>(null);
  let bannerPreview = $state<string | null>(null);

  function handleLogoUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoPreview = typeof reader.result === 'string' ? reader.result : null;
      };
      reader.readAsDataURL(file);
    }
  }

  function handleBannerUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        bannerPreview = typeof reader.result === 'string' ? reader.result : null;
      };
      reader.readAsDataURL(file);
    }
  }

  const form = superForm(defaults(zod(createStoreSchema)), {
    validators: zodClient(createStoreSchema)
  });

  const { form: formData, enhance, delayed } = form;
</script>

<div class="min-h-screen bg-gray-50">
  <div class="sticky top-0 z-10 border-b bg-white shadow-sm">
    <div class="container mx-auto">
      <div class="flex h-16 items-center gap-4 px-4">
        <Button variant="ghost" size="icon" class="shrink-0">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <h1 class="text-xl font-semibold">Create New Shop</h1>
      </div>
    </div>
  </div>

  <div class="container mx-auto max-w-4xl py-8">
    <div class="grid gap-8 px-4">
      <Card.Root>
        <Card.Header>
          <Card.Title>Shop Information</Card.Title>
          <Card.Description>Enter the basic information about your shop</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-6">
          <Form.Field {form} name="shopName">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Shop Name</Form.Label>
                <Input {...props} bind:value={$formData.shopName} placeholder="Enter shop name" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="shopType">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Business Type</Form.Label>
                <Input {...props} bind:value={$formData.shopType} placeholder="e.g. Restaurant, Cafe" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="address">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Street Address</Form.Label>
                <Textarea {...props} bind:value={$formData.address} placeholder="Enter shop address" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="phoneNumber">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Phone Number</Form.Label>
                <Input {...props} bind:value={$formData.phoneNumber} placeholder="+1234567890" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>

          <Form.Field {form} name="email">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label>Email</Form.Label>
                <Input {...props} bind:value={$formData.email} type="email" placeholder="shop@example.com" />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        </Card.Content>
      </Card.Root>

      <!-- Images -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Shop Images</Card.Title>
          <Card.Description>Upload your shop logo and banner</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-6">
          <div class="space-y-4">
            <div>
              <Form.Label>Shop Logo</Form.Label>
              <div class="mt-2 flex items-center gap-4">
                {#if logoPreview}
                  <img src={logoPreview} alt="Logo preview" class="h-24 w-24 rounded-lg object-cover" />
                {:else}
                  <div class="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed">
                    <Camera class="h-8 w-8 text-gray-400" />
                  </div>
                {/if}
                <Input
                  type="file"
                  accept="image/*"
                  on:change={handleLogoUpload}
                  class="max-w-[200px]"
                />
              </div>
            </div>

            <div>
              <Form.Label>Shop Banner</Form.Label>
              <div class="mt-2 flex items-center gap-4">
                {#if bannerPreview}
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    class="h-32 w-56 rounded-lg object-cover"
                  />
                {:else}
                  <div class="flex h-32 w-56 items-center justify-center rounded-lg border-2 border-dashed">
                    <Camera class="h-8 w-8 text-gray-400" />
                  </div>
                {/if}
                <Input
                  type="file"
                  accept="image/*"
                  on:change={handleBannerUpload}
                  class="max-w-[200px]"
                />
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>

      <div class="flex justify-end">
        <Button type="submit" disabled={$delayed}>
          {#if $delayed}
            Creating shop...
          {:else}
            Create Shop
          {/if}
        </Button>
      </div>
    </div>
  </div>
</div>
