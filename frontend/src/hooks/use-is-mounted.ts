import { useSyncExternalStore } from "react"

const subscribe = () => () => undefined

export function useIsMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
