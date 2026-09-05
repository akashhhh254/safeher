import { RouteSafetyBreakdown, RiskLevel, CommunityReport } from '../types';

/**
 * Calculates distance in kilometers between two lat/lng coordinates (Haversine Formula)
 */
export function getDistanceKm(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const dLng = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[0] * Math.PI) / 180) *
      Math.cos((coord2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Deterministic Safety Scoring Engine
 */
export function calculateRouteSafety(
  routeGeometry: [number, number][],
  reports: CommunityReport[],
  routeCharacteristics?: {
    isMainArtery?: boolean;
    hasFootway?: boolean;
    nearbyFacilitiesCount?: number;
    profile?: string;
  }
): RouteSafetyBreakdown {
  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 6;
  const isDusk = (hour >= 18 && hour < 20) || (hour >= 6 && hour < 7);

  // 1. Time of Day factor
  let timeOfDayFactor = 1.0;
  if (isNight) {
    timeOfDayFactor = 0.78; // Night penalty
  } else if (isDusk) {
    timeOfDayFactor = 0.90;
  }

  // 2. Base Lighting Score (0-100)
  // Main roads with dedicated infrastructure score higher
  const baseLighting = routeCharacteristics?.isMainArtery ? 90 : 68;
  const lightingScore = Math.round(baseLighting * (isNight ? 0.85 : 1.0));

  // 3. Public Activity Score (0-100)
  const baseActivity = routeCharacteristics?.isMainArtery ? 88 : 58;
  const publicActivityScore = Math.round(baseActivity * (isNight ? 0.75 : 1.0));

  // 4. Emergency Facility Score (police / hospitals proximity proxy)
  const facilitiesCount = routeCharacteristics?.nearbyFacilitiesCount ?? 1;
  const facilityScore = Math.min(100, 50 + facilitiesCount * 22);

  // 5. Community Safety Reports along the route
  // Find reports within 200 meters of any route waypoint
  let totalReportPenalty = 0;
  let highRiskSegmentDetected = false;
  const bufferKm = 0.25; // 250m

  reports.forEach((report) => {
    if (report.status === 'resolved') return;

    // Check if report is near any coordinate in the geometry
    const isNearRoute = routeGeometry.some((pt) => getDistanceKm(pt, report.location) <= bufferKm);

    if (isNearRoute) {
      let severity = 10;
      if (report.category === 'harassment') {
        severity = 25;
        highRiskSegmentDetected = true;
      } else if (report.category === 'isolated_area' || report.category === 'poor_lighting') {
        severity = 15;
        if (isNight) highRiskSegmentDetected = true;
      } else if (report.category === 'suspicious_activity') {
        severity = 18;
      }
      totalReportPenalty += severity;
    }
  });

  const cappedReportPenalty = Math.min(45, totalReportPenalty);

  // 6. High-Risk Segment Penalty
  // MANDATE: "If a route contains a particularly high-risk segment, the route
  // should receive an appropriate penalty even if the overall average looks acceptable."
  let highRiskSegmentPenalty = 0;
  if (highRiskSegmentDetected) {
    highRiskSegmentPenalty = 22;
  } else if (!routeCharacteristics?.isMainArtery && isNight) {
    highRiskSegmentPenalty = 10; // isolated unlit night segment
  }

  // Weighted formula:
  // Base weights sum to 100:
  // Lighting: 25%, Public Activity: 25%, Facility Access: 25%, Base Clearance: 25%
  const rawScore =
    (lightingScore * 0.28) +
    (publicActivityScore * 0.28) +
    (facilityScore * 0.24) +
    20; // baseline public right-of-way score

  // Apply time of day factor, report deductions, and high risk penalty
  let compositeSafetyScore = Math.round((rawScore * timeOfDayFactor) - cappedReportPenalty - highRiskSegmentPenalty);
  compositeSafetyScore = Math.max(15, Math.min(99, compositeSafetyScore));

  // Determine Risk Level
  let riskLevel: RiskLevel = 'low';
  if (compositeSafetyScore < 50) {
    riskLevel = 'high';
  } else if (compositeSafetyScore < 70) {
    riskLevel = 'elevated';
  } else if (compositeSafetyScore < 85) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'low';
  }

  // Explainable factors
  const positiveFactors: string[] = [];
  const riskFactors: string[] = [];

  if (lightingScore >= 75) positiveFactors.push('Consistent street lighting');
  if (publicActivityScore >= 70) positiveFactors.push('High pedestrian & commercial activity');
  if (facilityScore >= 70) positiveFactors.push('Near verified emergency facilities');
  if (cappedReportPenalty === 0) positiveFactors.push('Zero active hazard reports');

  if (isNight) riskFactors.push('Night-time visibility restrictions');
  if (cappedReportPenalty > 0) riskFactors.push(`${Math.round(cappedReportPenalty / 10)} community safety report(s) nearby`);
  if (highRiskSegmentPenalty > 0) riskFactors.push('High-risk isolated segment detected along corridor');
  if (publicActivityScore < 60) riskFactors.push('Low foot traffic area');

  return {
    lightingScore,
    publicActivityScore,
    facilityScore,
    reportPenalty: cappedReportPenalty,
    timeOfDayFactor,
    highRiskSegmentPenalty,
    compositeSafetyScore,
    riskLevel,
    positiveFactors: positiveFactors.slice(0, 3),
    riskFactors: riskFactors.slice(0, 3)
  };
}
