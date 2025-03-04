// Types for our travel data
export type TransportOption = {
  emoji: string;
  label: string;
  value: string;
};

export const TRANSPORT_OPTIONS: TransportOption[] = [
  { emoji: '✈️', label: 'Flight', value: 'flight' },
  { emoji: '🚂', label: 'Train', value: 'train' },
  { emoji: '🚌', label: 'Bus', value: 'bus' },
  { emoji: '🚗', label: 'Car', value: 'car' },
  { emoji: '🛵', label: 'Taxi', value: 'taxi' },
  { emoji: '🚲', label: 'Bike', value: 'bike' },
  { emoji: '🚶', label: 'Walk', value: 'walk' },
];

export type TravelPoint = {
  city: string;
  date: string;
  transport: string[];
  customTransport?: string;
  notes?: string;
};
