export interface ScaleBounds {
	min?: number;
	max?: number;
}

export interface ZoomOptions {
	immediateBlend?: number;
	kick?: number;
	touchpadMultiplier?: number;
	stiffness?: number;
	damping?: number;
}

export interface WheelOptions {
	momentumFactor?: number;
	speed?: number;
}