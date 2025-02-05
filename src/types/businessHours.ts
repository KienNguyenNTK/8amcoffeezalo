export interface OpeningHours {
  id: string;
  openTime: string;  // Format: HH:mm
  closeTime: string; // Format: HH:mm
}

export interface ClosingTime {
  id: string;
  startTime: string;     // Format: YYYY-MM-DD HH:mm
  endTime: string;       // Format: YYYY-MM-DD HH:mm
  description: string;
}

export interface ClosingHours {
  id: string;
  closingTimes: ClosingTime[];
} 