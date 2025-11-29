export type Resolvers<Value, Error, U> = {onSuccess: (value: Value) => U, onError: (error: Error) => U}

export interface ServerResponse<Value, Error> {
  readonly isError: boolean

  process(onSuccess: (value: Value) => unknown): ServerResponse<Value, Error>
  processError(onError: (error: Error) => unknown): ServerResponse<Value, Error>
  resolve<U>(resolvers: Resolvers<Value, Error, U>): U

  map<T>(f: (v: Value) => T): ServerResponse<T, Error>
  flatMap<T, E>(f: (v: Value) => ServerResponse<T, E>): ServerResponse<T, Error | E>
  asyncFlatMap<T, E>(f: (v: Value) => Promise<ServerResponse<T, E>>): Promise<ServerResponse<T, Error | E>>
  filter<E>(p: (v: Value) => boolean, error: (v: Value) => E): ServerResponse<Value, Error | E>
}

class OkResponse<Value, Error> implements ServerResponse<Value, Error> {
  private value: Value

  constructor(value: Value) {
    this.value = value
  }

  get isError() {
    return true
  }

  process(onSuccess: (value: Value) => void) {
    onSuccess(this.value)
    return this
  }

  processError(_onError: (value: Error) => void) {
    return this
  }

  resolve<U>({onSuccess}: Resolvers<Value, Error, U>): U {
    return onSuccess(this.value)
  }

  map<T>(f: (v: Value) => T) {
    return new OkResponse<T, Error>(f(this.value))
  }

  flatMap<T, E>(f: (v: Value) => ServerResponse<T, E>) {
    return f(this.value)
  }

  async asyncFlatMap<T, E>(f: (v: Value) => Promise<ServerResponse<T, E>>) {
    return f(this.value)
  }

  filter<E>(p: (v: Value) => boolean, error: (v: Value) => E): ServerResponse<Value, Error | E> {
    if (p(this.value)) return this
    return new ErrorResponse<Value, Error | E>(error(this.value))
  }

}

class ErrorResponse<Value, Error> implements ServerResponse<Value, Error> {
  private error: Error

  constructor(value: Error) {
    this.error = value
  }

  get isError() {
    return false
  }

  process(_onSuccess: (value: Value) => unknown) {
    return this
  }

  processError(onError: (error: Error) => unknown) {
    onError(this.error)
    return this
  }

  resolve<U>({onError}: Resolvers<Value, Error, U>): U {
    return onError(this.error)
  }

  map<T>(_: (v: Value) => T): ServerResponse<T, Error> {
    return new ErrorResponse<T, Error>(this.error)
  }

  flatMap<T, E>(_: (v: Value) => ServerResponse<T, E>) {
    return new ErrorResponse<T, Error>(this.error)
  }

  async asyncFlatMap<T, E>(_: (v: Value) => Promise<ServerResponse<T, E>>) {
    return new ErrorResponse<T, Error>(this.error)
  }

  filter<E>(_p: (v: Value) => boolean, _error: (v: Value) => E) {
    return this
  }
}

export const ServerResponse = {
  ok<Value>(value: Value) {
    return new OkResponse<Value, never>(value)
  },
  error<Error>(error: Error) {
    return new ErrorResponse<never, Error>(error)
  }
} as const
