/**
 * Öffentlicher Skyscanner-Suchlink (keine API, keine Preise, kein Affiliate-Tracking).
 * Hin- und Rückflug am selben Tag. Der Preis dort ist unabhängig von DAYGO und muss vor Ort geprüft werden.
 * Sobald ein Skyscanner-Partnerzugang besteht, hier die Tracking-Parameter ergänzen.
 */
const HOST = process.env.NEXT_PUBLIC_SKYSCANNER_HOST ?? "www.skyscanner.net";
export function skyscannerUrl(from: string, to: string, date: string, adults = 1): string {
  const d = date.slice(2).replace(/-/g, ""); // 2026-12-05 -> 261205
  return `https://${HOST}/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${d}/${d}/?adultsv2=${adults}&cabinclass=economy&rtn=1`;
}
