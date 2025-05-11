<script>
	// --- JavaScript Logic ---
	const orderElement = document.getElementById('order');
	const riderElement = document.getElementById('rider');
	const statusMessage = document.getElementById('status-message');
	const startButton = document.getElementById('start-btn');
	const resetButton = document.getElementById('reset-btn');

	const STATES = {
		IDLE: 'IDLE',
		ORDER_PLACED: 'ORDER_PLACED', // Order appears at customer
		VENDOR_RECEIVES: 'VENDOR_RECEIVES', // Order moves to vendor
		VENDOR_PREPARING: 'VENDOR_PREPARING', // Waiting state at vendor
		RIDER_ASSIGNED: 'RIDER_ASSIGNED', // Rider appears at vendor
		RIDER_PICKUP: 'RIDER_PICKUP', // Order attaches to rider (visually)
		RIDER_DELIVERING: 'RIDER_DELIVERING', // Rider+Order move to customer
		DELIVERED: 'DELIVERED', // Order dropped at customer
		RIDER_RETURNING: 'RIDER_RETURNING', // Rider returns to vendor
		COMPLETED: 'COMPLETED' // Rider back at vendor
	};

	let currentState = STATES.IDLE;
	let timeoutId = null;
	let orderIsWithRider = false; // Track if order is attached

	// --- UI Update Function ---
	function updateUI(state) {
		console.log('Updating UI for state:', state); // Debug log
		statusMessage.innerHTML = getStatusText(state);

		// Reset all state classes first for clarity
		orderElement.className = 'movable order'; // Keep base classes
		riderElement.className = 'movable rider';

		orderIsWithRider = false; // Reset attachment flag

		switch (state) {
			case STATES.IDLE:
				orderElement.classList.remove('visible');
				riderElement.classList.remove('visible');
				riderElement.classList.remove('has-order');
				startButton.textContent = 'Start Simulation';
				startButton.disabled = false;
				resetButton.disabled = true;
				break;

			case STATES.ORDER_PLACED:
				orderElement.classList.add('visible', 'state-placed');
				riderElement.classList.remove('visible');
				break;

			case STATES.VENDOR_RECEIVES:
				orderElement.classList.add('visible', 'state-moving-to-vendor');
				// CSS transition handles the movement based on the class change
				break;

			case STATES.VENDOR_PREPARING:
				// Order is now visually at the vendor
				orderElement.classList.add('visible', 'state-at-vendor');
				// Rider still hidden
				riderElement.classList.remove('visible');
				break;

			case STATES.RIDER_ASSIGNED:
				orderElement.classList.add('visible', 'state-at-vendor'); // Order stays put
				riderElement.classList.add('visible', 'state-at-vendor'); // Rider appears
				break;

			case STATES.RIDER_PICKUP:
				orderElement.classList.add('visible', 'state-pickup', 'state-pickup-transition'); // Use instant transition class
				riderElement.classList.add('visible', 'state-at-vendor', 'has-order');
				// After a tiny delay for CSS to apply the instant jump, remove the transition class
				// And mark that the order is now logically with the rider
				setTimeout(() => {
					orderElement.classList.remove('state-pickup-transition');
					orderElement.classList.add('state-at-vendor'); // Positionally it's still here until rider moves
					orderIsWithRider = true;
					console.log('Order marked as with rider');
				}, 50); // Small delay
				break;

			case STATES.RIDER_DELIVERING:
				riderElement.classList.add('visible', 'state-delivering', 'has-order');
				// Order follows the rider visually because its position class will also change
				orderElement.classList.add('visible', 'state-with-rider-moving');
				// Force the order's 'left' position to match rider's target destination instantly
				// The rider's transition will make it look like they move together
				orderElement.style.left = riderElement.style.left; // Match rider's *target* style immediately
				orderElement.classList.remove('state-at-vendor'); // Remove previous position
				orderElement.classList.add('state-delivered'); // Set target position class
				orderIsWithRider = true; // Ensure flag is set
				break;

			case STATES.DELIVERED:
				// Rider arrives, drops order
				riderElement.classList.add('visible', 'state-at-customer'); // Rider stops at customer
				riderElement.classList.remove('has-order'); // Rider no longer has order
				orderElement.classList.add('visible', 'state-delivered'); // Order is now fixed at customer
				orderElement.classList.remove('state-with-rider-moving');
				orderIsWithRider = false; // Order detached
				break;

			case STATES.RIDER_RETURNING:
				riderElement.classList.add('visible', 'state-returning'); // Rider starts moving back
				riderElement.classList.remove('state-at-customer'); // Remove customer position class
				orderElement.classList.add('visible', 'state-delivered'); // Order stays at customer
				break;

			case STATES.COMPLETED:
				riderElement.classList.add('visible', 'state-completed'); // Rider back at vendor
				orderElement.classList.remove('visible'); // Hide delivered order
				startButton.textContent = 'Start New Order';
				startButton.disabled = false;
				resetButton.disabled = true;
				break;
		}
	}

	// --- Status Text Helper ---
	function getStatusText(state) {
		switch (state) {
			case STATES.IDLE:
				return 'Waiting for order...';
			case STATES.ORDER_PLACED:
				return '🍕 <strong>Order placed</strong> by Customer!';
			case STATES.VENDOR_RECEIVES:
				return '➡️ Order en route to Vendor...';
			case STATES.VENDOR_PREPARING:
				return '🏪 Vendor <strong>preparing order</strong>...';
			case STATES.RIDER_ASSIGNED:
				return '🏍️ <strong>Rider assigned!</strong> Heading out...';
			case STATES.RIDER_PICKUP:
				return '🖐️ Rider <strong>picking up</strong> order...';
			case STATES.RIDER_DELIVERING:
				return '💨 Rider <strong>delivering</strong> to Customer...';
			case STATES.DELIVERED:
				return '✅ <strong>Order delivered!</strong>';
			case STATES.RIDER_RETURNING:
				return '🏍️ Rider <strong>returning</strong> to Vendor...';
			case STATES.COMPLETED:
				return '🏁 <strong>Delivery complete!</strong> Rider back.';
			default:
				return 'Unknown state';
		}
	}

	// --- Simulation Control ---
	function advanceState() {
		clearTimeout(timeoutId); // Clear previous timeout

		let nextState = STATES.IDLE;
		let delay = 1500; // Default delay

		// Determine next state and delay
		switch (currentState) {
			case STATES.IDLE:
				nextState = STATES.ORDER_PLACED;
				delay = 500;
				break;
			case STATES.ORDER_PLACED:
				nextState = STATES.VENDOR_RECEIVES;
				delay = 1800;
				break; // Order travel time
			case STATES.VENDOR_RECEIVES:
				nextState = STATES.VENDOR_PREPARING;
				delay = 2500;
				break; // Preparation time
			case STATES.VENDOR_PREPARING:
				nextState = STATES.RIDER_ASSIGNED;
				delay = 1000;
				break; // Rider appears quick
			case STATES.RIDER_ASSIGNED:
				nextState = STATES.RIDER_PICKUP;
				delay = 1200;
				break; // Pickup time
			case STATES.RIDER_PICKUP:
				nextState = STATES.RIDER_DELIVERING;
				delay = 3000;
				break; // Delivery travel time
			case STATES.RIDER_DELIVERING:
				nextState = STATES.DELIVERED;
				delay = 800;
				break; // Drop off quick
			case STATES.DELIVERED:
				nextState = STATES.RIDER_RETURNING;
				delay = 2500;
				break; // Return travel time
			case STATES.RIDER_RETURNING:
				nextState = STATES.COMPLETED;
				delay = 500;
				break; // Arrival quick
			case STATES.COMPLETED: // Stop the simulation loop
				updateUI(STATES.COMPLETED); // Ensure final UI update
				return;
		}

		// Update UI to reflect the *start* of the current state transition
		updateUI(currentState);

		// Set the new current state
		currentState = nextState;

		// Schedule the next step
		console.log('Scheduling next state:', currentState, 'in', delay, 'ms');
		timeoutId = setTimeout(advanceState, delay);
	}

	function startSimulation() {
		if (currentState === STATES.IDLE || currentState === STATES.COMPLETED) {
			console.log('Starting simulation...');
			resetButton.disabled = false;
			startButton.disabled = true;
			currentState = STATES.IDLE; // Ensure starting from clean slate
			advanceState(); // Kick off the process
		}
	}

	function resetSimulation() {
		console.log('Resetting simulation...');
		clearTimeout(timeoutId);
		timeoutId = null;
		currentState = STATES.IDLE;
		orderIsWithRider = false;
		updateUI(STATES.IDLE); // Reset UI immediately
	}

	// --- Event Listeners ---
	startButton.addEventListener('click', startSimulation);
	resetButton.addEventListener('click', resetSimulation);

	// --- Initial Setup ---
	document.addEventListener('DOMContentLoaded', () => {
		console.log('DOM Loaded. Initializing UI.');
		updateUI(STATES.IDLE); // Set initial state visually
	});
</script>

<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Food Delivery Simulation</title>
		<!-- Font Awesome for Icons -->
		<link
			rel="stylesheet"
			href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
			integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
			crossorigin="anonymous"
			referrerpolicy="no-referrer"
		/>
	</head>
	<body>
		<main>
			<h1>Food Delivery Simulation</h1>

			<div class="simulation-container">
				<!-- Customer -->
				<div class="entity customer">
					<i class="fas fa-user"></i>
					<span>Customer</span>
				</div>

				<!-- Path & Movables -->
				<div class="path"></div>
				<div class="movable order" id="order">
					<i class="fas fa-pizza-slice"></i>
				</div>
				<div class="movable rider" id="rider">
					<i class="fas fa-motorcycle"></i>
				</div>

				<!-- Vendor -->
				<div class="entity vendor">
					<i class="fas fa-store"></i>
					<span>Vendor</span>
				</div>
			</div>

			<div class="status" id="status-message">Waiting for order...</div>

			<div class="controls">
				<button id="start-btn">Start Simulation</button>
				<button id="reset-btn" disabled>Reset</button>
			</div>
		</main>
	</body>
</html>

<style>
	/* --- CSS Styling --- */
	:root {
		--customer-pos-percent: 10%; /* Position from left */
		--vendor-pos-percent: 90%; /* Position from left */
		--rider-offset: 50px; /* Rider's position relative to vendor/customer edge */
		--order-offset: 50px; /* Order's position relative to customer edge */

		--transition-speed-slow: 2.5s;
		--transition-speed-medium: 1.8s;
		--transition-speed-fast: 1s;
		--transition-speed-instant: 0.1s; /* For quick attach/detach */

		--customer-color: #3498db;
		--vendor-color: #e74c3c;
		--rider-color: #f39c12;
		--order-color: #9b59b6;
		--path-color: #ecf0f1;
		--bg-color: #f9f9f9;
		--text-color: #333;
	}

	body {
		font-family: sans-serif;
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background-color: var(--bg-color);
		color: var(--text-color);
		margin: 0;
	}

	main {
		max-width: 800px;
		width: 90%;
		padding: 2em;
		background-color: #fff;
		border-radius: 8px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	h1 {
		color: #2c3e50;
		margin-bottom: 1.5em;
	}

	.simulation-container {
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 150px; /* Visual height */
		padding: 20px 5%; /* Padding relative to main container width */
		margin-bottom: 1.5em;
		background-color: #fdfdfd;
		border-radius: 8px;
		box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
		overflow: hidden; /* Hide anything poking out */
	}

	.entity {
		display: flex;
		flex-direction: column;
		align-items: center;
		z-index: 10;
		position: relative; /* Needed for z-index */
	}
	.entity i {
		font-size: 3em; /* Larger icons */
		margin-bottom: 0.3em;
		filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.2));
	}
	.entity span {
		font-weight: bold;
		font-size: 0.9em;
	}
	.customer {
		transform: translateX(-50%);
	} /* Center visually */
	.vendor {
		transform: translateX(50%);
	} /* Center visually */
	.customer i,
	.customer span {
		color: var(--customer-color);
	}
	.vendor i,
	.vendor span {
		color: var(--vendor-color);
	}

	.path {
		position: absolute;
		left: var(--customer-pos-percent);
		right: calc(100% - var(--vendor-pos-percent));
		top: 50%;
		height: 8px;
		background: linear-gradient(to right, #e0e0e0, #d0d0d0);
		border-radius: 4px;
		transform: translateY(-50%);
		z-index: 1;
	}

	/* Movable items */
	.movable {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		opacity: 0;
		visibility: hidden; /* Use visibility to prevent interaction when hidden */
		transition:
			left var(--transition-speed-medium) ease-in-out,
			opacity 0.5s ease,
			visibility 0.5s;
		z-index: 5;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.movable.visible {
		opacity: 1;
		visibility: visible;
	}
	.movable i {
		font-size: 2.5em; /* Slightly smaller than entities */
		filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.15));
	}

	.order {
		left: calc(var(--customer-pos-percent) + var(--order-offset));
		transition-duration: var(--transition-speed-medium); /* Default speed */
	}
	.order i {
		color: var(--order-color);
	}

	.rider {
		/* Start hidden near vendor */
		left: calc(var(--vendor-pos-percent) - var(--rider-offset));
		transition-duration: var(--transition-speed-medium); /* Default speed */
	}
	.rider i {
		color: var(--rider-color);
	}
	.rider.has-order i {
		/* Optional: visual cue for carrying order */
		transform: scale(1.1);
		transition: transform 0.3s ease;
	}
	.rider:not(.has-order) i {
		transform: scale(1);
		transition: transform 0.3s ease;
	}

	/* --- State Classes --- */

	/* Order States */
	.order.state-placed,
	.order.state-delivered {
		left: calc(var(--customer-pos-percent) + var(--order-offset));
	}
	.order.state-at-vendor,
	.order.state-pickup {
		/* Position before pickup */
		left: calc(var(--vendor-pos-percent) - var(--rider-offset));
	}
	.order.state-moving-to-vendor {
		left: calc(var(--vendor-pos-percent) - var(--rider-offset));
		transition-duration: var(--transition-speed-medium);
	}
	.order.state-with-rider-moving {
		/* Will be updated by JS to follow rider */
		transition-duration: var(--transition-speed-slow); /* Match rider speed */
	}
	/* Instant jump when picked up or dropped */
	.order.state-pickup-transition {
		transition-duration: var(--transition-speed-instant) !important;
	}

	/* Rider States */
	.rider.state-at-vendor,
	.rider.state-returning,
	.rider.state-completed {
		left: calc(var(--vendor-pos-percent) - var(--rider-offset));
	}
	.rider.state-delivering,
	.rider.state-at-customer {
		/* Arrived at customer */
		left: calc(var(--customer-pos-percent) + var(--order-offset));
	}

	.rider.state-delivering {
		transition-duration: var(--transition-speed-slow);
	}
	.rider.state-returning {
		transition-duration: var(--transition-speed-slow);
	}

	/* Status & Controls */
	.status {
		margin-top: 2em;
		font-size: 1.1em;
		min-height: 2.5em; /* Prevent layout shifts */
		color: #555;
		font-weight: 500;
	}
	.status strong {
		color: #000;
		font-weight: 600;
		display: inline-block; /* Helps with animation/transition if added */
		padding: 0 5px;
	}

	.controls {
		margin-top: 1.5em;
	}
	.controls button {
		padding: 12px 25px;
		margin: 0 10px;
		font-size: 1em;
		font-weight: bold;
		cursor: pointer;
		border: none;
		border-radius: 25px; /* Pill shape */
		color: white;
		transition:
			background-color 0.3s ease,
			opacity 0.3s ease,
			transform 0.1s ease;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}
	.controls button#start-btn {
		background-color: var(--customer-color);
	}
	.controls button#reset-btn {
		background-color: var(--vendor-color);
	}

	.controls button:disabled {
		background-color: #bdc3c7;
		cursor: not-allowed;
		opacity: 0.7;
		box-shadow: none;
	}
	.controls button:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.controls button:active:not(:disabled) {
		transform: scale(0.98);
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
	}
</style>
