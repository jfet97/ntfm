// minimal queue interface used by QueuesSet
export interface Queue<T> {
  enqueue(el: T): void;
  dequeue(): T | undefined;
  peekFirst(): T|undefined;
  getSize(): number;
  clear(): void;
  [Symbol.iterator](): IterableIterator<T>;
}

export interface QueueConstructor<T> {
  new(arrayOfT?: Array<T>): Queue<T>;
}