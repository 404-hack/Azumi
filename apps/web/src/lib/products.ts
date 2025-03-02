export const products: Product[] = [
	{
		id: '1',
		name: 'Special Fried Rice',
		description: 'Our signature fried rice with vegetables and special sauce',
		image: '/placeholder.svg?height=200&width=300',
		price: 12.99,
		categories: [
			{
				id: 'proteins',
				name: 'Add Protein',
				variants: [
					{ id: 'chicken', name: 'Chicken', price: 3.99 },
					{ id: 'beef', name: 'Beef', price: 4.99 },
					{ id: 'shrimp', name: 'Shrimp', price: 5.99 }
				]
			},
			{
				id: 'extras',
				name: 'Extra Toppings',
				multiSelect: true,
				variants: [
					{ id: 'egg', name: 'Fried Egg', price: 1.99 },
					{ id: 'vegetables', name: 'Extra Vegetables', price: 2.49 },
					{ id: 'sauce', name: 'Extra Sauce', price: 0.99 }
				]
			}
		]
	},
	{
		id: '2',
		name: 'Noodle Bowl',
		description: 'Fresh noodles in savory broth with green onions',
		image: '/placeholder.svg?height=200&width=300',
		price: 11.99,
		categories: [
			{
				id: 'proteins',
				name: 'Add Protein',
				variants: [
					{ id: 'chicken', name: 'Chicken', price: 3.99 },
					{ id: 'beef', name: 'Beef', price: 4.99 },
					{ id: 'tofu', name: 'Tofu', price: 2.99 }
				]
			},
			{
				id: 'extras',
				name: 'Extra Toppings',
				multiSelect: true,
				variants: [
					{ id: 'egg', name: 'Boiled Egg', price: 1.99 },
					{ id: 'bamboo', name: 'Bamboo Shoots', price: 1.49 },
					{ id: 'corn', name: 'Corn', price: 0.99 }
				]
			}
		]
	}
];
