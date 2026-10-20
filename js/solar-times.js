// Zapnij Pasy vGPT_2.8.1 — local NOAA/Meeus solar calculations, no network dependency.
const RAD=Math.PI/180, DAY=86400000;
export const KATOWICE=Object.freeze({latitude:50.2649,longitude:19.0238});
export function validCoordinates(point){return !!point&&Number.isFinite(point.latitude)&&Math.abs(point.latitude)<=90&&Number.isFinite(point.longitude)&&Math.abs(point.longitude)<=180;}
function sun(jd){
  const t=(jd-2451545)/36525;
  const l=((280.46646+t*(36000.76983+.0003032*t))%360+360)%360;
  const m=(357.52911+t*(35999.05029-.0001537*t))*RAD;
  const e=.016708634-t*(.000042037+.0000001267*t);
  const c=Math.sin(m)*(1.914602-t*(.004817+.000014*t))+Math.sin(2*m)*(.019993-.000101*t)+Math.sin(3*m)*.000289;
  const omega=(125.04-1934.136*t)*RAD;
  const lambda=(l+c-.00569-.00478*Math.sin(omega))*RAD;
  const obliquity=(23+(26+(21.448-t*(46.815+t*(.00059-t*.001813)))/60)/60+.00256*Math.cos(omega))*RAD;
  const declination=Math.asin(Math.sin(obliquity)*Math.sin(lambda));
  const y=Math.tan(obliquity/2)**2, lr=l*RAD;
  const equation=4/RAD*(y*Math.sin(2*lr)-2*e*Math.sin(m)+4*e*y*Math.sin(m)*Math.cos(2*lr)-.5*y*y*Math.sin(4*lr)-1.25*e*e*Math.sin(2*m));
  return {declination,equation};
}
export function solarTimes(date,point=KATOWICE){
  if(!validCoordinates(point)||!Number.isFinite(+date))throw new TypeError('Invalid solar date or coordinates');
  const midnight=Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()),jd=midnight/DAY+2440587.5,latitude=point.latitude*RAD;
  const event=setting=>{
    let minutes=720-4*point.longitude;
    for(let i=0;i<3;i++){
      const {declination:d,equation:e}=sun(jd+minutes/1440);
      const cosine=(Math.cos(90.833*RAD)-Math.sin(latitude)*Math.sin(d))/(Math.cos(latitude)*Math.cos(d));
      if(cosine>1||cosine< -1)return null;
      const angle=Math.acos(cosine)/RAD;
      minutes=720-4*(point.longitude+(setting?-angle:angle))-e;
    }
    return Math.round(midnight+minutes*60000);
  };
  const sunrise=event(false),sunset=event(true);
  const {declination}=sun(jd+.5);
  const noonAltitude=Math.asin(Math.sin(latitude)*Math.sin(declination)+Math.cos(latitude)*Math.cos(declination))/RAD;
  return {sunrise,sunset,polarNight:sunrise===null&&sunset===null&&noonAltitude<-.833};
}
export function daylightState(now,point=KATOWICE){
  const date=new Date(now),today=solarTimes(date,point);
  const tomorrow=new Date(date.getFullYear(),date.getMonth(),date.getDate()+1,12);
  const nextMidnight=+new Date(date.getFullYear(),date.getMonth(),date.getDate()+1);
  if(today.sunrise===null||today.sunset===null)return {...today,night:today.polarNight,nextBoundary:nextMidnight};
  const night=now<today.sunrise||now>=today.sunset;
  const nextBoundary=now<today.sunrise?today.sunrise:now<today.sunset?today.sunset:solarTimes(tomorrow,point).sunrise||nextMidnight;
  return {...today,night,nextBoundary};
}
