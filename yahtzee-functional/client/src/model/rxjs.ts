import type { ApolloClient, DocumentNode } from "@apollo/client";
import { Subject } from "rxjs";

export async function subscriptionsRxJS<T, E, Key extends string, EventType extends Record<Key, E>>(apolloClient: ApolloClient, subscriptionQuery: DocumentNode, extractor: (evt: EventType) => T): Promise<Subject<T>> {
  const subject = new Subject<T>();
  const apolloObservable = apolloClient.subscribe<EventType>({ query: subscriptionQuery })
  apolloObservable.subscribe({
    next({data}) {
      if (data) {
        subject.next(extractor(data))
      }
    },
    error(err) {
      subject.error(err)
    },
    complete() {
      subject.complete() 
    },
  })
  return subject
}
