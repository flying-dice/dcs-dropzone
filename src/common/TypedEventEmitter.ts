import { EventEmitter } from "node:events";

type EventPayloadMap = Record<string | symbol, any[]>;

type Listener<Args extends any[]> = (...args: Args) => void;

export class TypedEventEmitter<Events extends EventPayloadMap> extends EventEmitter {
	override on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
		return super.on(event as string, listener);
	}
	override addListener<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
		return super.addListener(event as string, listener);
	}

	override once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
		return super.once(event as string, listener);
	}

	override off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
		return super.off(event as string, listener);
	}
	override removeListener<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
		return super.removeListener(event as string, listener);
	}

	override emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean {
		return super.emit(event as string, ...args);
	}
}
