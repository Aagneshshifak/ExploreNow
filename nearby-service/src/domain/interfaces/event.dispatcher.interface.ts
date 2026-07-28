export interface IEventDispatcher {
  /**
   * Publish an event to a specific channel.
   * @param channel The topic/channel name
   * @param payload The event payload
   */
  publish<T>(channel: string, payload: T): Promise<void>;

  /**
   * Subscribe to a specific channel.
   * @param channel The topic/channel name
   * @param callback The function to execute when an event is received
   */
  subscribe<T>(channel: string, callback: (payload: T) => void): Promise<void>;
}
