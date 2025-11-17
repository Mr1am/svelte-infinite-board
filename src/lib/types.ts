/**
 * Defines the bounds for scaling operations, specifying optional minimum and maximum scale values.
 *
 * @interface ScaleBounds
 * @property {number} [min] - The minimum allowed scale value. If not provided, no lower bound is enforced.
 * @property {number} [max] - The maximum allowed scale value. If not provided, no upper bound is enforced.
 */
export interface ScaleBounds {
	min?: number;
	max?: number;
}

/**
 * Configuration options for zoom behavior, controlling aspects like blending, touchpad sensitivity, and spring physics.
 *
 * @interface ZoomOptions
 * @property {number} [immediateBlend] - Factor for immediate blending during zoom transitions.
 * @property {number} [kick] - Initial velocity kick for zoom animations.
 * @property {number} [touchpadMultiplier] - Multiplier for zoom sensitivity on touchpads.
 * @property {number} [stiffness] - Stiffness coefficient for spring-based zoom animations.
 * @property {number} [damping] - Damping coefficient to control oscillation in zoom animations.
 */
export interface ZoomOptions {
	immediateBlend?: number;
	kick?: number;
	touchpadMultiplier?: number;
	stiffness?: number;
	damping?: number;
}

/**
 * Options for wheel-based interactions, such as scrolling or zooming with a mouse wheel.
 *
 * @interface WheelOptions
 * @property {number} [momentumFactor] - Factor to apply momentum to wheel events for smoother scrolling.
 * @property {number} [speed] - Speed multiplier for wheel-based movements.
 */
export interface WheelOptions {
	momentumFactor?: number;
	speed?: number;
}

/**
 * Represents velocity in 2D space, used for momentum or inertia calculations.
 *
 * @interface Velocity
 * @property {number} x - Velocity along the x-axis.
 * @property {number} y - Velocity along the y-axis.
 */
export interface Velocity {
	x: number;
	y: number;
}


/**
 * State for drag operations, tracking if a drag is occurring and positions.
 *
 * @interface Drag
 * @property {boolean} happens - Indicates if a drag is currently happening.
 * @property {number} startX - Starting x-position of the drag.
 * @property {number} startY - Starting y-position of the drag.
 * @property {number} lastX - Last recorded x-position during drag.
 * @property {number} lastY - Last recorded y-position during drag.
 */
export interface Drag {
	happens: boolean;
	startX: number;
	startY: number;
	lastX: number;
	lastY: number;
}

/**
 * Anchor point for zoom operations.
 *
 * @interface ZoomAnchor
 * @property {number} x - X-coordinate of the zoom anchor.
 * @property {number} y - Y-coordinate of the zoom anchor.
 */
export interface ZoomAnchor {
	x: number;
	y: number;
}

/**
 * State for pinch gestures, used in touch-based scaling.
 *
 * @interface Pinch
 * @property {number} distance - Distance between touch points.
 * @property {number} scale - Current scale factor from the pinch.
 * @property {number} centerX - X-coordinate of the pinch center.
 * @property {number} centerY - Y-coordinate of the pinch center.
 * @property {number} offsetX - X-offset from the pinch.
 * @property {number} offsetY - Y-offset from the pinch.
 */
export interface Pinch {
	distance: number;
	scale: number;
	centerX: number;
	centerY: number;
	offsetX: number;
	offsetY: number;
}

/**
 * State for scaling animations, including target scale and velocity.
 *
 * @interface Scaling
 * @property {number} target - Target scale value.
 * @property {number} velocity - Current velocity of the scaling animation.
 * @property {null | number} frame - Frame reference for animation (null if not animating).
 * @property {number} current - Current scale value.
 */
export interface Scaling {
	target: number;
	velocity: number;
	frame: null | number;
	current: number;
}

/**
 * Represents the current view state, including position and scale.
 *
 * @interface View
 * @property {number} x - X-position of the view.
 * @property {number} y - Y-position of the view.
 * @property {number} scale - Current scale of the view.
 */
export interface View {
	x: number;
	y: number;
	scale: number;
}

/**
 * Properties for a board component, handling view, interactions, and events.
 *
 * @interface BoardProps
 * @property {number} [x] - Initial x-position.
 * @property {number} [y] - Initial y-position.
 * @property {number} [scale] - Initial scale.
 * @property {ScaleBounds} [scaleBounds] - Bounds for scaling.
 * @property {ZoomOptions} [zoom] - Zoom configuration options.
 * @property {WheelOptions} [wheel] - Wheel interaction options.
 * @property {number} [inertiaFriction] - Friction coefficient for inertia.
 * @property {() => any} [onInertiaEnd] - Callback when inertia ends.
 * @property {(scale: number) => any} [onScaleEnd] - Callback when scaling ends.
 * @property {(e: WheelEvent) => any} [onWheel] - Callback for wheel events.
 * @property {(e: MouseEvent | TouchEvent) => any} [onPanStart] - Callback when panning starts.
 * @property {(e: MouseEvent | TouchEvent) => any} [onPan] - Callback during panning.
 * @property {(e?: MouseEvent | TouchEvent) => any} [onPanEnd] - Callback when panning ends.
 * @property {(e?: MouseEvent | TouchEvent) => any} [onClick] - Callback for click events.
 * @property {boolean} [mousePan] - Enable panning with mouse.
 * @property {boolean} [singleTouchPan] - Enable panning with single touch.
 * @property {boolean} [doubleTouchPan] - Enable panning with double touch.
 * @property {(over: number) => number} [lowerScaleRubber] - Function for handling scale below min.
 * @property {(over: number) => number} [higherScaleRubber] - Function for handling scale above max.
 * @property {BgScope[]} [bgScopes] - Array of background scopes.
 * @property {import('svelte/transition').FadeParams} [bgParams] - Fade parameters for background scopes transitions.
 * @property {HTMLElement | null} [board] - Reference to the board element.
 * @property {import('svelte').Snippet} [children] - Child components or content.
 */
export interface BoardProps {
	x?: number;
	y?: number;
	scale?: number;
	scaleBounds?: ScaleBounds;
	zoom?: ZoomOptions;
	wheel?: WheelOptions;
	inertiaFriction?: number;
	onInertiaEnd?: () => any;
	onScaleEnd?: (scale: number) => any;
	onWheel?: (e: WheelEvent) => any;
	onPanStart?: (e: MouseEvent | TouchEvent) => any;
	onPan?: (e: MouseEvent | TouchEvent) => any;
	onPanEnd?: (e?: MouseEvent | TouchEvent) => any;
	onClick?: (e: MouseEvent | TouchEvent) => any;
	clickThreshold?: number;
	onMove?: (e: MouseEvent | TouchEvent) => any;
	onClickDown?: (e: MouseEvent | TouchEvent) => any;
	mousePan?: boolean;
	singleTouchPan?: boolean;
	doubleTouchPan?: boolean;
	lowerScaleRubber?: (over: number) => number;
	higherScaleRubber?: (over: number) => number;
	bgScopes?: BgScope[];
	bgParams?: import('svelte/transition').FadeParams;
	board?: HTMLElement | null;
	children?: import('svelte').Snippet;
}

/**
 * Defines a scope for background styling based on scale and size.
 *
 * @interface BgScope
 * @property {number} [scale] - Scale threshold for this background scope.
 * @property {number} [size] - Size parameter for the background.
 * @property {string | null} [bg] - Background color or svg (null for none).
 */
export interface BgScope {
	scale?: number;
	size?: number;
	bg?: string | null;
}
