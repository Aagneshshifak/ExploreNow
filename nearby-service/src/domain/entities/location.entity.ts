export interface LiveLocation {
  userId: string;
  lat: number;
  lng: number;
  ts: number;       // Timestamp (Epoch milliseconds)
  spd?: number;     // Speed (m/s)
  dir?: number;     // Direction (degrees)
  h3: string;       // H3 Cell Index
  on: number;       // Online status (1 = Online, 0 = Offline)
}
