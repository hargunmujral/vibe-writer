// Event type definitions to fix "Parameter 'e' implicitly has an 'any' type" errors

interface SyntheticEvent<T = Element> {
  bubbles: boolean;
  cancelable: boolean;
  currentTarget: EventTarget & T;
  defaultPrevented: boolean;
  eventPhase: number;
  isTrusted: boolean;
  nativeEvent: Event;
  preventDefault(): void;
  stopPropagation(): void;
  target: EventTarget;
  timeStamp: number;
  type: string;
}

interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
  target: EventTarget & T;
}

interface MouseEvent<T = Element> extends SyntheticEvent<T> {
  altKey: boolean;
  button: number;
  buttons: number;
  clientX: number;
  clientY: number;
  ctrlKey: boolean;
  metaKey: boolean;
  movementX: number;
  movementY: number;
  pageX: number;
  pageY: number;
  relatedTarget: EventTarget | null;
  screenX: number;
  screenY: number;
  shiftKey: boolean;
}

// Extend the JSX namespace
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
