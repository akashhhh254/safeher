export type RouteMode = 'safest' | 'balanced' | 'fastest';

export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high';

export interface RouteSafetyBreakdown {
  lightingScore: number;       // 0 - 100
  publicActivityScore: number; // 0 - 100
  facilityScore: number;       // 0 - 100 (police/hospitals)
  reportPenalty: number;       // 0 - 100 (penalty deducted)
  timeOfDayFactor: number;     // multiplier 0.7 - 1.0
  highRiskSegmentPenalty: number; // penalty for any critical segment
  compositeSafetyScore: number;// 0 - 100
  riskLevel: RiskLevel;
  positiveFactors: string[];
  riskFactors: string[];
}

export interface RouteAlternative {
  id: string;
  name: string;
  summary: string;
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][]; // [lat, lng] array for Leaflet polyline
  safety: RouteSafetyBreakdown;
  isRecommended: boolean;
  aiExplanation?: string;
  highRiskSegments?: [number, number][][];
}

export type ReportCategory =
  | 'poor_lighting'
  | 'harassment'
  | 'isolated_area'
  | 'suspicious_activity'
  | 'road_issue'
  | 'stray_animals'
  | 'other';

export interface CommunityReport {
  id: string;
  category: ReportCategory;
  title: string;
  description: string;
  location: [number, number]; // [lat, lng]
  address?: string;
  createdAt: string;
  upvotes: number;
  status: 'active' | 'resolved' | 'investigating';
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: 'Parent' | 'Partner' | 'Sibling' | 'Friend' | 'Guardian' | 'Other';
  phone: string;
  email?: string;
  isPrimary: boolean;
}

export interface ActiveJourney {
  id: string;
  route: RouteAlternative;
  originName: string;
  destinationName: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
  mode: RouteMode;
  startedAt: number; // timestamp ms
  checkInIntervalMinutes: number;
  nextCheckInTimestamp: number;
  lastCheckInTimestamp: number;
  status: 'active' | 'overdue' | 'sos' | 'completed';
}

export interface SafetyPOI {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'transit_hub' | 'safe_haven';
  location: [number, number];
  distanceKm: number;
}
