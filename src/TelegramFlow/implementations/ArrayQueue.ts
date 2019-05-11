import { Queue, QueueConstructor } from "../interfaces/QueueInterface";
import { staticImplements } from "../../Decorators/staticImplements"

// implementation of the Queue interface using arrays

// when any ArrayQueue<T> will be instantiated, e.g. new ArrayQueue<string>(),
// ArrayQueue<string>.prototype.constructor (CHECKED_CONSTRUCTOR_TYPE) will be checked
// and it will have to be of type QueueConstructor<any> (WANTED_CONSTRUCTOR_TYPE)
// or a more specific extension of it
// QueueConstructor<string> is a valid extension of QueueConstructor<any>
// so if ArrayQueue<string>.prototype.constructor will implement correctly QueueConstructor<string>
// the check will end successfully
// anyway, because of the type signature of the decorator, a check is done also at compiletime
@staticImplements<QueueConstructor<any>>()
export class ArrayQueue<T> implements Queue<T> {
  private queue: Array<T>;

  public constructor(arrayOfT: Array<T> = []) {
    this.queue = [...arrayOfT];
  }

  public enqueue(el: T): void {
    this.queue.push(el);
  };

  public dequeue(): T | undefined {
    return this.queue.shift();
  }

  public peekFirst(): T | undefined {
    return this.queue[0];
  }

  public getSize(): number {
    return this.queue.length;
  }

  public clear(): void {
    this.queue.length = 0;
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.queue[Symbol.iterator]();
  }

}