<!-- <script lang="ts">
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button";
    import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Plus, Package, ChevronRight } from "lucide-svelte";
    import { toast } from "$lib/components/ui/use-toast";
    import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Switch } from "$lib/components/ui/switch";

    export let data;
    
    const { packs } = data;
    
    let newPack = {
        name: "",
        description: "",
        price: 0,
        isActive: true
    };
    
    let isDialogOpen = false;
    
    async function createPack() {
        try {
            const response = await fetch('/api/vendor/pack/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newPack)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create pack');
            }
            
            const responseData = await response.json();
            
            toast({
                title: "Success",
                description: "Pack created successfully"
            });
            
            // Close dialog and reset form
            isDialogOpen = false;
            newPack = {
                name: "",
                description: "",
                price: 0,
                isActive: true
            };
            
            // Navigate to the new pack
            goto(`/vendor/menu/packs/${responseData.data.id}`);
            
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to create pack",
                variant: "destructive"
            });
        }
    }
    
    function viewPack(id: string) {
        goto(`/vendor/menu/packs/${id}`);
    }
</script>

<div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold">Meal Packs</h1>
            <p class="text-gray-500">Create and manage your meal packages</p>
        </div>
        
        <Dialog bind:open={isDialogOpen}>
            <DialogTrigger asChild let:dialogTrigger>
                <Button {...dialogTrigger} class="flex items-center">
                    <Plus class="mr-2 h-4 w-4" />
                    <span>Create Pack</span>
                </Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Pack</DialogTitle>
                    <DialogDescription>
                        Create a new meal pack to group menu items together.
                    </DialogDescription>
                </DialogHeader>
                
                <div class="grid gap-4 py-4">
                    <div class="space-y-2">
                        <Label for="pack-name">Pack Name</Label>
                        <Input id="pack-name" bind:value={newPack.name} placeholder="e.g. Family Combo" />
                    </div>
                    
                    <div class="space-y-2">
                        <Label for="pack-description">Description</Label>
                        <Textarea id="pack-description" bind:value={newPack.description} placeholder="Describe what's included in this pack" />
                    </div>
                    
                    <div class="space-y-2">
                        <Label for="pack-price">Price (NGN)</Label>
                        <Input id="pack-price" type="number" bind:value={newPack.price} placeholder="0.00" />
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        <Switch id="pack-active" checked={newPack.isActive} on:change={(e) => newPack.isActive = e.target.checked} />
                        <Label for="pack-active">Active</Label>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button type="submit" on:click={createPack}>Create Pack</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
    
    {#if packs.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each packs as pack}
                <Card class="cursor-pointer hover:shadow-md transition-shadow" on:click={() => viewPack(pack.id)}>
                    <CardHeader class="pb-2">
                        <div class="flex justify-between items-start">
                            <CardTitle class="text-xl">{pack.name}</CardTitle>
                            {#if pack.isActive}
                                <Badge variant="default">Active</Badge>
                            {:else}
                                <Badge variant="outline">Inactive</Badge>
                            {/if}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p class="text-gray-500 text-sm line-clamp-2">{pack.description || "No description"}</p>
                        
                        <div class="mt-4">
                            <Badge variant="secondary" class="text-lg">₦{pack.price.toLocaleString()}</Badge>
                            
                            {#if pack.menus && pack.menus.length > 0}
                                <p class="text-sm mt-2">{pack.menus.length} item{pack.menus.length !== 1 ? 's' : ''}</p>
                            {:else}
                                <p class="text-sm mt-2 text-gray-400">No items added</p>
                            {/if}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" class="w-full flex justify-between items-center">
                            <span>View Details</span>
                            <ChevronRight class="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            {/each}
        </div>
    {:else}
        <div class="text-center py-12 border rounded-lg bg-gray-50">
            <Package class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-4 text-lg font-medium">No Packs Yet</h3>
            <p class="mt-2 text-gray-500">Create your first meal pack to start bundling menu items.</p>
            <Button on:click={() => isDialogOpen = true} class="mt-4">
                <Plus class="mr-2 h-4 w-4" />
                Create Pack
            </Button>
        </div>
    {/if}
</div> -->
