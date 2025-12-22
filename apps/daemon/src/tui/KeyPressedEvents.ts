import { EventEmitter } from "node:events";
import type { KeyEvent } from "@opentui/core";

export class KeyPressedEvents extends EventEmitter {
	override emit(eventName: string, keyEvent: KeyEvent): boolean {
		return super.emit(eventName, keyEvent);
	}

	override on(eventName: string, listener: (keyEvent: KeyEvent) => void): this {
		return super.on(eventName, listener);
	}

	override off(eventName: string, listener: (keyEvent: KeyEvent) => void): this {
		return super.off(eventName, listener);
	}
}

export const keyPressedEvents = new KeyPressedEvents();
