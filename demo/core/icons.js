/* =====================================================================
   PIAFFE · Icônes « Paddock » et illustrations animées
   Icônes : grille 24, trait 1,8 arrondi, formes douces et généreuses.
   Un petit détail plein (classe f) donne du poids ; l'éclat de strass
   (classe af) ne marque que l'assistant et ce qui est réussi.
   Illustrations : window.ILLU.nom(options) renvoie un SVG animé.
   ===================================================================== */
(function(){
var c=function(x,y,r,k){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'"'+(k?' class="'+k+'"':'')+'/>'};
var p=function(d,k){return '<path d="'+d+'"'+(k?' class="'+k+'"':'')+'/>'};
var r=function(x,y,w,h,rx,k){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(rx||0)+'"'+(k?' class="'+k+'"':'')+'/>'};
/* éclat à 4 branches centré en x,y */
var st=function(x,y,s,k){s=s||2.2;return p('M'+x+' '+(y-s)+'Q'+x+' '+y+' '+(x+s)+' '+y+'Q'+x+' '+y+' '+x+' '+(y+s)+'Q'+x+' '+y+' '+(x-s)+' '+y+'Q'+x+' '+y+' '+x+' '+(y-s)+'Z',k||'af')};
/* tête de cheval du logo, ramenée sur la grille 24 */
var HEAD='M6.7 20.6C6.7 14.9 8.9 10.8 12 8.4L11.3 3.8L14.9 6.7C18.2 7.9 20.4 11 21.1 14.9L18.5 16.3C17 14.2 15.1 13.4 13.7 13.9C13.9 16.6 15.1 18.5 16.8 20.6';
var I={
 /* --- navigation --- */
 today:p('M3 17.5h18M6.5 17.5a5.5 5.5 0 0 1 11 0M12 5.5V8M5.6 8.6l1.7 1.7M18.4 8.6l-1.7 1.7M2.8 13.5h1.7M19.5 13.5h1.7M8.5 21h7'),
 planning:r(3.5,5,17,15.5,4.5)+p('M8 3v4M16 3v4M3.5 10.5h17')+r(7,13.3,4.2,3.8,1.2,'f'),
 horse:'<g transform="translate(-1.9 0)">'+p(HEAD)+c(15.7,10.6,1,'f')+'</g>',
 stable:p('M3.5 20.5V10L12 4.5l8.5 5.5v10.5M2.5 20.5h19M8 20.5v-6.5h8v6.5M8 14l8 6.5M16 14l-8 6.5'),
 camera:r(2.5,6.5,13,11,3.2)+p('M15.5 10.5l4.6-2.6a.9.9 0 0 1 1.4.8v6.6a.9.9 0 0 1-1.4.8l-4.6-2.6')+c(6.5,10.5,1.2,'f'),
 sensor:c(12,12,2.3,'f')+p('M8 8a5.7 5.7 0 0 0 0 8M16 16a5.7 5.7 0 0 0 0-8M5.2 5.2a9.6 9.6 0 0 0 0 13.6M18.8 18.8a9.6 9.6 0 0 0 0-13.6'),
 care:p('M12 20.2s-8-4.4-8-10.3A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8 2.5c0 5.9-8 10.3-8 10.3z')+p('M7.6 12.4h2.6l1.3-2.2 1.9 4.2 1.2-2h1.9'),
 feed:p('M4 10.5h16l-1.5 8.2a2.4 2.4 0 0 1-2.4 2H7.9a2.4 2.4 0 0 1-2.4-2z')+p('M8.5 10.5c-.2-2.7.9-5 3-6.4M12.5 10.5c0-2.3.9-4.1 2.8-5.3M16 10.5c.1-1.5.6-2.8 1.6-3.8')+p('M8.5 15h7'),
 members:c(9,8,3.3)+p('M2.8 19.5c.6-3.3 3.1-5.3 6.2-5.3s5.6 2 6.2 5.3')+c(17,9,2.6)+p('M16.3 14.3c2.7 0 4.6 1.6 5 4.5'),
 owner:p('M4 15a8 8 0 0 1 16 0z')+p('M20 15c1.4 0 2.3.8 2.3 1.8H13M6.5 15v1.8a5.5 5.5 0 0 0 5.5 4M12 7v3'),
 coach:c(12,6.3,3)+p('M5.5 21v-2.6A5 5 0 0 1 10.5 13.4h3a5 5 0 0 1 5 5V21')+p('M12 13.4l-1.4 3 1.4 1.6 1.4-1.6z','f'),
 compet:c(12,9,5.6)+p('M8.3 13.3l-1.8 7.7 5.5-2.6 5.5 2.6-1.8-7.7')+c(12,9,2.2,'f'),
 invoice:p('M6 3.5h12a.5.5 0 0 1 .5.5v16.6l-2.8-1.6-2.8 1.6-2.9-1.6-2.8 1.6-1.7-1V4a.5.5 0 0 1 .5-.5z')+p('M9 8.5h6M9 12h6M9 15.5h3.5'),
 accounting:p('M4 4v16h16')+r(7.5,12,2.8,5,1,'f')+r(12,8.5,2.8,8.5,1,'f')+r(16.5,5.5,2.8,11.5,1,'f'),
 team:c(9,8,3.3)+p('M2.8 19.5c.6-3.3 3.1-5.3 6.2-5.3s5.6 2 6.2 5.3')+c(17,9,2.6)+p('M16.3 14.3c2.7 0 4.6 1.6 5 4.5'),
 upkeep:p('M12 21V11M7.5 3.5v4.5a4.5 4.5 0 0 0 9 0V3.5M12 3.5v6.5')+p('M9.5 21h5'),
 stock:p('M3.5 8L12 3.8 20.5 8v8.4L12 20.7l-8.5-4.3z')+p('M3.5 8L12 12.3 20.5 8M12 12.3v8.4M7.8 5.9l8.5 4.3'),
 contract:p('M7 3.5h7l4 4V20a.6.6 0 0 1-.6.6H6.6A.6.6 0 0 1 6 20V4.1a.6.6 0 0 1 .6-.6z')+p('M14 3.5V8h4M9 11.5h5')+p('M9 16.2c1-1.6 1.8-1.6 2.2 0s1.2 1.5 2.3 0 1.5-.8 2 0'),
 shop:p('M4.5 9h15l-1.2 10.4a1.8 1.8 0 0 1-1.8 1.6h-9a1.8 1.8 0 0 1-1.8-1.6z')+p('M8.8 9V7.2a3.2 3.2 0 0 1 6.4 0V9')+c(12,14.5,1.4,'f'),
 chat:p('M4.6 5.5h14.8a1.1 1.1 0 0 1 1.1 1.1v9a1.1 1.1 0 0 1-1.1 1.1H10l-4.4 3.5v-3.5h-1a1.1 1.1 0 0 1-1.1-1.1v-9a1.1 1.1 0 0 1 1.1-1.1z')+p('M8 9.8h8M8 13h5'),
 assistant:p('M11 3.5c.6 4.4 2.9 6.7 7.3 7.3-4.4.6-6.7 2.9-7.3 7.3-.6-4.4-2.9-6.7-7.3-7.3 4.4-.6 6.7-2.9 7.3-7.3z')+st(18.6,17.8,2.8),
 plug:p('M9 3v4.5M15 3v4.5M6.5 7.5h11v3.8a5.5 5.5 0 0 1-11 0z')+p('M12 16.8V21'),
 api:p('M8 7l-5 5 5 5M16 7l5 5-5 5M13.6 4.5l-3.2 15'),
 mcp:c(6,6,2.3)+c(18,6,2.3)+c(12,18.5,2.3)+p('M8.3 6h7.4M7.1 8l3.8 8.5M16.9 8l-3.8 8.5')+c(12,10.6,1.3,'f'),
 import:p('M12 3.5v10.5M7.8 9.8l4.2 4.2 4.2-4.2M4.5 14.5v3.5a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-3.5'),
 settings:p('M4 7h9M17.5 7H20M4 17h3M11.5 17H20')+c(15.2,7,2.3)+c(9.2,17,2.3),
 report:r(3.5,3.5,17,17,4.5)+p('M7.5 15.5l3.2-3.7 2.6 2.4 3.4-4.4'),
 onboarding:p('M5.5 21V4M5.5 4.5h10.8a.7.7 0 0 1 .6 1L15 9l1.9 3.5a.7.7 0 0 1-.6 1H5.5')+st(19,18,2.6),
 /* --- interface --- */
 search:c(11,11,6.6)+p('M16 16l4.5 4.5'),
 bell:p('M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2.2H4.4z')+p('M10 21.2h4'),
 plus:p('M12 5v14M5 12h14'),
 minus:p('M5 12h14'),
 x:p('M6.5 6.5l11 11M17.5 6.5l-11 11'),
 check:p('M5 12.5l4.5 4.5L19 7.5'),
 right:p('M9.5 6l6 6-6 6'), left:p('M14.5 6l-6 6 6 6'), down:p('M6 9.5l6 6 6-6'), up:p('M6 14.5l6-6 6 6'),
 arrow:p('M5 12h14M13 6l6 6-6 6'),
 back:p('M19 12H5M11 6l-6 6 6 6'),
 ext:p('M13.5 4.5h6v6M19.5 4.5l-8.5 8.5M17.5 14v4.2a1.8 1.8 0 0 1-1.8 1.8H6.3a1.8 1.8 0 0 1-1.8-1.8V8.3a1.8 1.8 0 0 1 1.8-1.8H10'),
 more:c(5.5,12,1.5,'f')+c(12,12,1.5,'f')+c(18.5,12,1.5,'f'),
 menu:p('M4 7h16M4 12h16M4 17h10'),
 filter:p('M4 6h16M7 12h10M10 18h4'),
 sort:p('M7.5 4.5v15M4 16l3.5 3.5L11 16M16.5 19.5v-15M13 8l3.5-3.5L20 8'),
 download:p('M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14'),
 upload:p('M12 15V4M7.5 8.5L12 4l4.5 4.5M5 20h14'),
 edit:p('M4.5 19.5l.8-3.8L15.6 5.4a2.1 2.1 0 0 1 3 0l.1.1a2.1 2.1 0 0 1 0 3L8.4 18.7z')+p('M13.8 7.2l3 3M4.5 19.5h4'),
 trash:p('M4.5 6.5h15M9.5 6.5V4.8a.8.8 0 0 1 .8-.8h3.4a.8.8 0 0 1 .8.8v1.7M6.5 6.5l.9 12.6a1.6 1.6 0 0 0 1.6 1.4h6a1.6 1.6 0 0 0 1.6-1.4l.9-12.6M10 10.5v6M14 10.5v6'),
 copy:r(8,8,12,12,2.6)+p('M16 8V5.6A1.6 1.6 0 0 0 14.4 4H5.6A1.6 1.6 0 0 0 4 5.6v8.8A1.6 1.6 0 0 0 5.6 16H8'),
 link:p('M10 14a4.4 4.4 0 0 0 6.3 0l3-3a4.4 4.4 0 0 0-6.3-6.3l-1.2 1.2M14 10a4.4 4.4 0 0 0-6.3 0l-3 3a4.4 4.4 0 0 0 6.3 6.3l1.2-1.2'),
 clock:c(12,12,8.6)+p('M12 7.5V12l3 2'),
 pin:p('M12 21s6.6-6 6.6-11.1a6.6 6.6 0 0 0-13.2 0C5.4 15 12 21 12 21z')+c(12,9.9,2.4),
 user:c(12,8,3.6)+p('M5 20c.8-3.6 3.5-5.8 7-5.8s6.2 2.2 7 5.8'),
 child:c(12,6.2,2.8)+p('M8.2 11h7.6l.8 4.8H7.4zM9 15.8V21M15 15.8V21M8.2 11L5.5 8.5M15.8 11l2.7-2.5'),
 family:c(7.5,7,2.5)+c(16.5,7,2.5)+c(12,13.3,2)+p('M2.5 19.2a5 5 0 0 1 7.2-4.5M21.5 19.2a5 5 0 0 0-7.2-4.5M8.6 21a3.4 3.4 0 0 1 6.8 0'),
 lock:r(5,10.5,14,10,3)+p('M8 10.5V7.8a4 4 0 0 1 8 0v2.7')+c(12,15.5,1.4,'f'),
 shield:p('M12 3.3L5 6v5.6c0 4.3 3 7.7 7 9.1 4-1.4 7-4.8 7-9.1V6z')+p('M8.8 12.1l2.3 2.3 4.2-4.5'),
 eye:p('M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z')+c(12,12,3)+c(12,12,1.1,'f'),
 play:p('M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5a.8.8 0 0 0-1.2.7z'),
 pause:r(6.5,5,3.8,14,1.4)+r(13.7,5,3.8,14,1.4),
 rec:c(12,12,8)+c(12,12,3.6,'f'),
 mic:r(9,3,6,11,3)+p('M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6'),
 phone:p('M5.2 4h3.2l1.6 4.2-2.1 1.4a11.5 11.5 0 0 0 6.5 6.5l1.4-2.1 4.2 1.6v3.2a1.7 1.7 0 0 1-1.8 1.7A15.9 15.9 0 0 1 3.5 5.8 1.7 1.7 0 0 1 5.2 4z'),
 mail:r(3,5.5,18,13,3.2)+p('M3.8 7.5l8.2 5.6 8.2-5.6'),
 sms:p('M4.6 5h14.8a1.1 1.1 0 0 1 1.1 1.1v9.3a1.1 1.1 0 0 1-1.1 1.1H11l-4.5 3.5v-3.5H4.6a1.1 1.1 0 0 1-1.1-1.1V6.1A1.1 1.1 0 0 1 4.6 5z')+c(8.3,10.8,1.1,'f')+c(12,10.8,1.1,'f')+c(15.7,10.8,1.1,'f'),
 euro:p('M17.5 6.6A7 7 0 1 0 17.5 17.4M4.5 10.3h8.5M4.5 13.7h8.5'),
 card:r(2.5,5.5,19,13,3.2)+p('M2.5 10h19')+r(5.5,13.3,4.5,2,1,'f'),
 bank:p('M3.5 9.3L12 4.3l8.5 5zM5.5 9.5v7.5M10 9.5v7.5M14 9.5v7.5M18.5 9.5v7.5M3.5 20h17'),
 wallet:p('M4 7.5v10.3a2.2 2.2 0 0 0 2.2 2.2h13.3V9.5H6.2A2.2 2.2 0 0 1 4 7.3 2.2 2.2 0 0 1 6.2 5H17.5V3.8')+c(16,14.7,1.4,'f'),
 ticket:p('M3.5 8.5V6.6a1.1 1.1 0 0 1 1.1-1.1h14.8a1.1 1.1 0 0 1 1.1 1.1v1.9a3.5 3.5 0 0 0 0 7v1.9a1.1 1.1 0 0 1-1.1 1.1H4.6a1.1 1.1 0 0 1-1.1-1.1v-1.9a3.5 3.5 0 0 0 0-7z')+p('M14.5 6v2M14.5 11v2M14.5 16v2'),
 gift:r(3.5,8.5,17,4,1.5)+p('M5 12.5v6.4a1.6 1.6 0 0 0 1.6 1.6h10.8a1.6 1.6 0 0 0 1.6-1.6v-6.4M12 8.5v12M12 8.5S10.6 4 8.2 4.4c-1.8.3-1.4 4.1 3.8 4.1zM12 8.5s1.4-4.5 3.8-4.1c1.8.3 1.4 4.1-3.8 4.1'),
 bag:p('M5.2 8h13.6l-.9 11a1.7 1.7 0 0 1-1.7 1.5H7.8a1.7 1.7 0 0 1-1.7-1.5zM9 8V6.8a3 3 0 0 1 6 0V8'),
 doc:p('M7 3.5h7l4 4V20a.6.6 0 0 1-.6.6H6.6A.6.6 0 0 1 6 20V4.1a.6.6 0 0 1 .6-.6z')+p('M14 3.5V8h4M9 12.5h6M9 16h4'),
 folder:p('M3.5 7.2a2 2 0 0 1 2-2h3.7a1.6 1.6 0 0 1 1.2.5l1.6 1.8h6.5a2 2 0 0 1 2 2v8.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z'),
 sign:p('M3 17.5c2.5-4 4.5-11 7-11 2 0 .5 8.5 3 8.5 1.5 0 2-3 3.5-3 1.2 0 1.3 2.5 4.5 2.5M3 21h18'),
 qr:r(3.5,3.5,6.5,6.5,2)+r(14,3.5,6.5,6.5,2)+r(3.5,14,6.5,6.5,2)+r(5.8,5.8,1.9,1.9,.5,'f')+r(16.3,5.8,1.9,1.9,.5,'f')+r(5.8,16.3,1.9,1.9,.5,'f')+p('M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM18 14h2.5M14 18v2.5'),
 scan:p('M4 8.5V6.2A2.2 2.2 0 0 1 6.2 4h2.3M15.5 4h2.3A2.2 2.2 0 0 1 20 6.2v2.3M20 15.5v2.3a2.2 2.2 0 0 1-2.2 2.2h-2.3M8.5 20H6.2A2.2 2.2 0 0 1 4 17.8v-2.3M4 12h16'),
 truck:p('M2.5 6.8a1.3 1.3 0 0 1 1.3-1.3h8.4a1.3 1.3 0 0 1 1.3 1.3V16.5h-11zM13.5 9.5h4.2l3.8 4v3h-8')+c(6.5,17.7,1.9)+c(17,17.7,1.9),
 van:p('M2.5 9a2 2 0 0 1 2-2h10a4 4 0 0 1 4 4v5.5h-16zM18.5 11.5h1.2a1.8 1.8 0 0 1 1.8 1.8v3.2h-3M7 7v9.5M10.5 10h4')+c(6.5,17.8,1.8)+c(15,17.8,1.8),
 car:p('M3.5 16.5v-3.6a1.5 1.5 0 0 1 .3-.9L6 7.7a1.5 1.5 0 0 1 1.3-.7h9.4a1.5 1.5 0 0 1 1.3.7L20.2 12a1.5 1.5 0 0 1 .3.9v3.6zM3.5 12.5h17')+c(7.5,16.6,1.8)+c(16.5,16.6,1.8),
 route:c(6,18,2.3)+c(18,6,2.3,'f')+p('M8.3 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.7'),
 thermo:p('M12 3a2.2 2.2 0 0 0-2.2 2.2v9a4.2 4.2 0 1 0 4.4 0v-9A2.2 2.2 0 0 0 12 3z')+c(12,17.5,1.8,'f')+p('M12 10.5v5'),
 drop:p('M12 3.2c3.9 4.8 6.4 8 6.4 11a6.4 6.4 0 0 1-12.8 0c0-3 2.5-6.2 6.4-11z')+p('M9.2 14.6a2.9 2.9 0 0 0 2.4 2.7'),
 wind:p('M3 9h11a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3M3 19h7'),
 sun:c(12,12,4)+'<g class="sun-r">'+p('M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4')+'</g>',
 moon:p('M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z'),
 cloud:p('M7 18.5h10a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.6 1A3.5 3.5 0 0 0 7 18.5z'),
 rain:p('M7 14.5h10a3.6 3.6 0 0 0 .5-7.2 5 5 0 0 0-9.6.9A3.2 3.2 0 0 0 7 14.5z')+p('M8.5 17.5l-1 2.5M12.5 17.5l-1 2.5M16.5 17.5l-1 2.5'),
 heart:p('M12 20s-8-4.6-8-10.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.6C20 15.4 12 20 12 20z'),
 pulse:p('M2.5 12.5h4l2.5-6 4 12 2.5-6h6'),
 syringe:p('M17.5 3.5l3 3M19 5l-9.3 9.3-3-3L16 2M6.7 11.3l-2 2 6 6 2-2M7.6 16.4L4 20M11 9l1.6 1.6M13.4 6.6L15 8.2'),
 pill:p('M10.2 4.7a4.5 4.5 0 0 1 6.4 6.4l-5.5 5.5a4.5 4.5 0 0 1-6.4-6.4z')+p('M10.2 4.7a4.5 4.5 0 0 1 6.4 6.4l-2.7 2.7-6.4-6.4z','f'),
 hoof:p('M7.2 4.5C5 7 4.2 10.4 5 13.4 6.1 17.8 9 20 12 20s5.9-2.2 7-6.6c.8-3-.1-6.4-2.2-8.9')+p('M6.4 9.2h1.6M6.6 13.6h1.6M16 9.2h1.6M15.8 13.6h1.6'),
 tooth:p('M7.4 4c-2.4 0-3.6 2.2-3.2 4.8.4 2.6 1.6 4.2 2 7 .4 2.5 1 4.7 2.3 4.7 1.7 0 1.6-5.3 3.5-5.3s1.8 5.3 3.5 5.3c1.3 0 1.9-2.2 2.3-4.7.4-2.8 1.6-4.4 2-7C20.2 6.2 19 4 16.6 4c-1.9 0-2.9 1.4-4.6 1.4S9.3 4 7.4 4z'),
 bone:'<g transform="rotate(-45 12 12)">'+p('M8 10.3h8a2.4 2.4 0 1 1 2.6 1.7 2.4 2.4 0 1 1-2.6 1.7H8a2.4 2.4 0 1 1-2.6-1.7A2.4 2.4 0 1 1 8 10.3z')+'</g>',
 star:p('M12 3.8l2.5 5.2 5.6.7-4.1 3.9 1.1 5.6L12 16.4l-5.1 2.8 1.1-5.6-4.1-3.9 5.6-.7z'),
 flag:p('M5.5 21V4M5.5 4.5h10.8a.7.7 0 0 1 .6 1L15 9l1.9 3.5a.7.7 0 0 1-.6 1H5.5'),
 trophy:p('M7.5 4h9v5.2a4.5 4.5 0 0 1-9 0zM7.5 6H5.3a.8.8 0 0 0-.8.9 3.4 3.4 0 0 0 3.2 3.1M16.5 6h2.2a.8.8 0 0 1 .8.9 3.4 3.4 0 0 1-3.2 3.1M12 13.7V17M8.5 20.5h7M9.5 17h5v3.5h-5z'),
 medal:c(12,15,5.3)+p('M8.6 10.9L6.2 3.5h3.9l1.9 5M15.4 10.9l2.4-7.4h-3.9l-1.9 5')+c(12,15,2,'f'),
 jump:p('M4.5 21V7M19.5 21V7M2.5 21h4M17.5 21h4')+r(4.5,9.3,15,2.4,1.2,'f')+p('M4.5 15h15'),
 arena:r(3,6,18,12,6)+p('M8 12h8'),
 paddock:p('M3 8.5h18M3 14h18M5.5 5.5v14M12 5.5v14M18.5 5.5v14'),
 hay:r(3.5,8.5,17,10,2.6)+p('M9 8.5v10M15 8.5v10M5.5 8.5l.8-2.6M10.5 8.5l.4-3M13.6 8.5l-.3-2.8M18.5 8.5l-.7-2.6'),
 bucket:p('M5 8h14l-1.4 11.3a1.8 1.8 0 0 1-1.8 1.6H8.2a1.8 1.8 0 0 1-1.8-1.6zM5.2 8a6.8 6.8 0 0 1 13.6 0')+p('M7.6 12.5h8.8'),
 wrench:p('M14.6 3.9a4.6 4.6 0 0 0-1.1 4.8l-8.6 8.6a2.1 2.1 0 0 0 3 3l8.6-8.6a4.6 4.6 0 0 0 4.8-1.1 4.5 4.5 0 0 0 1-4.9l-2.6 2.6-2.4-.6-.6-2.4L20.1 2.9a4.5 4.5 0 0 0-5.5 1z'),
 bolt:p('M13.2 2.8L5 13.2h6.4l-.9 8 8.3-10.6h-6.5z'),
 wifi:p('M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0')+c(12,19.2,1.2,'f'),
 battery:r(2.5,7,17,10,3)+p('M21.5 10.5v3')+r(5,9.5,8,5,1.4,'f'),
 weight:p('M6.4 8.5h11.2a1 1 0 0 1 1 .8l2 10a1 1 0 0 1-1 1.2H4.4a1 1 0 0 1-1-1.2l2-10a1 1 0 0 1 1-.8z')+c(12,5.6,2.3),
 gauge:p('M4.2 17.5a8.5 8.5 0 1 1 15.6 0')+p('M12 14l4-4.3')+c(12,14,1.6,'f'),
 stopwatch:c(12,13.5,7.5)+p('M10 2.5h4M12 2.5V6M12 13.5l3-3M18.6 6.6l1.5-1.5'),
 layers:p('M12 3.5L2.8 8.3 12 13.1l9.2-4.8z')+p('M2.8 12.4L12 17.2l9.2-4.8M2.8 16.5L12 21.3l9.2-4.8'),
 cube:p('M12 2.7l8.3 4.7v9.2L12 21.3l-8.3-4.7V7.4z')+p('M3.7 7.4L12 12.1l8.3-4.7M12 12.1v9.2'),
 rotate:p('M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5'),
 grid:r(4,4,6.6,6.6,2.2)+r(13.4,4,6.6,6.6,2.2)+r(4,13.4,6.6,6.6,2.2)+r(13.4,13.4,6.6,6.6,2.2),
 list:p('M9 6.5h11M9 12h11M9 17.5h11')+c(4.8,6.5,1.3,'f')+c(4.8,12,1.3,'f')+c(4.8,17.5,1.3,'f'),
 kanban:r(3.5,3.5,5,17,2)+r(9.5,3.5,5,11,2)+r(15.5,3.5,5,14,2),
 map:p('M9 4.5L3.5 6.6v13L9 17.5l6 2.1 5.5-2.1v-13L15 6.6z')+p('M9 4.5v13M15 6.6v13'),
 globe:c(12,12,8.6)+p('M3.4 12h17.2M12 3.4c2.4 2.4 3.5 5.3 3.5 8.6s-1.1 6.2-3.5 8.6c-2.4-2.4-3.5-5.3-3.5-8.6s1.1-6.2 3.5-8.6z'),
 sliders:p('M4 7h9M17.5 7H20M4 17h3M11.5 17H20')+c(15.2,7,2.3)+c(9.2,17,2.3),
 palette:p('M12 3.5a8.5 8.5 0 0 0 0 17c1.5 0 2-1 1.5-2.3-.7-1.7.3-3.2 2-3.2h2.2A2.8 2.8 0 0 0 20.5 12 8.5 8.5 0 0 0 12 3.5z')+c(7.5,11.5,1.3,'f')+c(10,7.5,1.3,'f')+c(14.5,7.5,1.3,'f'),
 logout:p('M14 4.5H6.3a1.8 1.8 0 0 0-1.8 1.8v11.4a1.8 1.8 0 0 0 1.8 1.8H14M10 12h11M17 8l4 4-4 4'),
 bulb:p('M9.2 17.5h5.6M10.2 21h3.6M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2v.6h5v-.6c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z'),
 send:p('M20.5 3.5L10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4z'),
 attach:p('M20 11.5l-8 8a5 5 0 0 1-7-7L13.5 4a3.3 3.3 0 0 1 4.7 4.7l-8.4 8.4a1.7 1.7 0 0 1-2.4-2.4L15 7'),
 image:r(3,4.5,18,15,3.2)+c(8.5,9.5,1.8,'f')+p('M3.5 16.5l5-4.3 4 3.3 3-2.4 5 4.2'),
 video:r(2.5,6,13.5,12,3.2)+p('M16 10.4l4.3-2.5a.9.9 0 0 1 1.3.8v6.6a.9.9 0 0 1-1.3.8L16 13.6'),
 expand:p('M14.5 4.5h5v5M9.5 19.5h-5v-5M19.5 4.5l-6 6M4.5 19.5l6-6'),
 refresh:p('M20 11a8 8 0 0 0-14.5-4.5L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.5 4.5L20 15.5M20 20v-4.5h-4.5'),
 info:c(12,12,8.6)+p('M12 11v5.5')+c(12,7.8,1.2,'f'),
 alert:p('M10.3 4.6a2 2 0 0 1 3.4 0l7.4 12.8a2 2 0 0 1-1.7 3H4.6a2 2 0 0 1-1.7-3z')+p('M12 9.5v4')+c(12,16.9,1.2,'f'),
 checkc:c(12,12,8.6)+p('M8 12.3l2.8 2.7L16 9.5'),
 xc:c(12,12,8.6)+p('M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6'),
 dot:c(12,12,3.2,'f'),
 cmd:p('M9 6.5a2.5 2.5 0 1 0-2.5 2.5H17.5a2.5 2.5 0 1 0-2.5-2.5v11a2.5 2.5 0 1 0 2.5-2.5h-11A2.5 2.5 0 1 0 9 17.5z'),
 code:p('M8 7l-5 5 5 5M16 7l5 5-5 5'),
 key:c(8,15.5,4.5)+p('M11.2 12.3L20 3.5M16.5 7l3 3M14 9.5l2 2')+c(8,15.5,1.3,'f'),
 webhook:c(6.5,17,2.5)+c(17.5,17,2.5)+c(12,6.5,2.5)+p('M10.8 8.8L7.6 14.7M9 17h6M13.2 8.8l3.2 6'),
 robot:r(4.5,8,15,11.5,3.8)+p('M12 4.8V8M9.5 16h5')+c(9,12.8,1.3,'f')+c(15,12.8,1.3,'f')+c(12,4,1.2,'f'),
 spark:p('M12 3c.7 5 3.4 7.6 8.4 8.4-5 .8-7.7 3.4-8.4 8.4-.7-5-3.4-7.6-8.4-8.4 5-.8 7.7-3.4 8.4-8.4z','f'),
 swap:p('M4 8h15M15.5 4.5L19 8l-3.5 3.5M20 16H5M8.5 12.5L5 16l3.5 3.5'),
 calendar_add:r(3.5,5,17,15.5,4.5)+p('M8 3v4M16 3v4M3.5 10.5h17M12 13v5M9.5 15.5h5'),
 waitlist:p('M4 6.5h11M4 11.5h9M4 16.5h5')+c(17,16.5,4)+p('M17 14.6v2l1.4 1'),
 repeat:p('M17 3l3 3-3 3M4 11V9.2A3.2 3.2 0 0 1 7.2 6H20M7 21l-3-3 3-3M20 13v1.8a3.2 3.2 0 0 1-3.2 3.2H4'),
 holiday:p('M12 21V11.5M3.8 11.5a8.2 8.2 0 0 1 16.4 0zM12 3.3v.9M8.5 11.5C8.5 7.6 10 5 12 3.3c2 1.7 3.5 4.3 3.5 8.2M8 21h8'),
 clockin:c(12,13,7.5)+p('M12 9.5V13l2.5 1.5M9 2.5h6M12 2.5v3'),
 hourglass:p('M7 3.5h10M7 20.5h10M8 3.5c0 4.2 8 4.4 8 8.5s-8 4.3-8 8.5M16 3.5c0 4.2-8 4.4-8 8.5s8 4.3 8 8.5')+p('M10 18.3h4l-2-2z','f'),
 tag:p('M3.5 12.3V5a1.5 1.5 0 0 1 1.5-1.5h7.3l8.2 8.2a1.5 1.5 0 0 1 0 2.1l-6.2 6.2a1.5 1.5 0 0 1-2.1 0z')+c(8.2,8.2,1.5,'f'),
 percent:p('M18.5 5.5l-13 13')+c(7.2,7.2,2.4)+c(16.8,16.8,2.4),
 trend:p('M3 17l6-6 4 4 8-8M15 7h6v6'),
 eye_off:p('M3.5 3.5l17 17M10.4 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.4 17.4 0 0 1-2.9 3.6M6.6 7.3A17 17 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.3-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2'),
 moonstar:p('M19 14.6A7.6 7.6 0 1 1 9.4 5a6.1 6.1 0 0 0 9.6 9.6z')+st(17.5,5.5,2.4,'f'),
 whistle:p('M3.5 13.3a5 5 0 1 0 9.8 1.4l7.2-2.3V8.8a.8.8 0 0 0-.8-.8H10.4a5 5 0 0 0-6.9 5.3zM14 8V6')+c(8.5,13.5,1.4,'f'),
 saddle:p('M3 11.5c2.2 0 3.2-2.8 5.6-2.8h6.8c2.4 0 3.4 2.8 5.6 2.8M4.6 11.5c0 3.4 3.2 5.5 7.4 5.5s7.4-2.1 7.4-5.5M12 17v3.5M9.5 20.5h5'),
 helmet:p('M3.8 15.5a8.2 8.2 0 0 1 16.4 0zM2.8 15.5h18.4a.8.8 0 0 1 .8.8v.4a.8.8 0 0 1-.8.8H2.8M12 7.3v8.2'),
 brush:r(4,15,16,5.5,2.2)+p('M6 15v-3h12v3M8.5 12V5.7a1.5 1.5 0 0 1 3 0V12M12.5 12V5.7a1.5 1.5 0 0 1 3 0V12'),
 shavings:p('M5 7.5L12 4l7 3.5v9.3L12 20.3 5 16.8z')+p('M8.5 11c1.5.8 2.5.8 3.5 0s2-.8 3.5 0M8.5 14.5c1.5.8 2.5.8 3.5 0s2-.8 3.5 0'),
 tractor:c(7,16,4)+c(7,16,1.3,'f')+c(18,17.5,2.5)+p('M7 12V6.5h5.5l1.5 5.5h4.5a1 1 0 0 1 1 1v2.3M3.5 12h10.5'),
 harrow:p('M3 8.5h18M5 8.5l-1 6M9.5 8.5l-1 6M14.5 8.5l-1 6M19 8.5l-1 6M12 8.5V4.5M9 4.5h6')+p('M3 18.5c3 0 3-1.5 6-1.5s3 1.5 6 1.5 3-1.5 6-1.5')
};
I.horse_logo='<path class="f" d="M28 86C28 62 37 45 50 35L47 16L62 28C76 33 85 46 88 62L77 68C71 59 63 56 57 58C58 69 63 77 70 86Z" stroke-width="4" stroke="currentColor"/>';
window.ICONS=I;
window.ICON=function(n,k){var b=I[n]||I.dot;return '<svg class="i'+(k?' '+k:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+b+'</svg>'};
/* Logo Piaffe « La pièce » : tête de cheval pleine, œil en strass */
window.LOGO=function(size,col,eye,anim){size=size||24;col=col||'currentColor';eye=eye||'var(--strass)';
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 100 100" aria-hidden="true" style="flex:none;display:block"><path fill="'+col+'" stroke="'+col+'" stroke-width="4" stroke-linejoin="round" d="M28 86C28 62 37 45 50 35L47 16L62 28C76 33 85 46 88 62L77 68C71 59 63 56 57 58C58 69 63 77 70 86Z"/><path '+(anim?'class="sc" ':'')+'fill="'+eye+'" d="M65 35.500Q65 44 73.500 44Q65 44 65 52.500Q65 44 56.500 44Q65 44 65 35.500Z"/></svg>'};
window.HORSE_GLYPH=function(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="'+HEAD+'Z" transform="translate(-2.2 0)"/><circle cx="13.5" cy="10.6" r="1.1" fill="var(--surface)"/></svg>'};

/* =====================================================================
   Illustrations animées : ILLU.cheval(), ILLU.fer(), ILLU.selle(), ILLU.pieces(),
   ILLU.foin(), ILLU.seau(), ILLU.bombe(), ILLU.van(), ILLU.trophee(), ILLU.contrat()
   Options : {size:96 (px, ou null pour remplir), still:true (sans mouvement), cls:'…'}
   Couleurs : jetons --coat, --mane, --hay, --hz, --mo, --rd… (clair et sombre).
   ===================================================================== */
var SP=function(x,y,s){return '<path class="il-tw" d="M'+x+' '+(y-s)+'Q'+x+' '+y+' '+(x+s)+' '+y+'Q'+x+' '+y+' '+x+' '+(y+s)+'Q'+x+' '+y+' '+(x-s)+' '+y+'Q'+x+' '+y+' '+x+' '+(y-s)+'Z" fill="var(--strass)"/>'};
function wrap(name,vb,body,o){o=o||{};var sz=o.size===null?'':(' width="'+(o.size||96)+'" height="'+(o.size||96)+'"');
  return '<svg class="illu il-'+name+(o.cls?' '+o.cls:'')+'"'+sz+' viewBox="'+vb+'" aria-hidden="true"'+(o.still?' style="--still:1"':'')+'>'+(o.still?body.replace(/ class="il-[a-z]+"/g,''):body)+'</svg>'}
function BALE(x,y,w,h){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="9" fill="var(--hay)"/>'+
 '<path d="M'+(x+6)+' '+(y+h*.35)+'h'+(w*.3)+'M'+(x+w*.45)+' '+(y+h*.55)+'h'+(w*.35)+'M'+(x+8)+' '+(y+h*.75)+'h'+(w*.25)+'M'+(x+w*.5)+' '+(y+h*.22)+'h'+(w*.3)+'" stroke="var(--hay-2)" stroke-width="2.4" stroke-linecap="round"/>'+
 '<path d="M'+(x+w*.3)+' '+y+'v'+h+'M'+(x+w*.7)+' '+y+'v'+h+'" stroke="var(--twine)" stroke-width="3.2"/>'+
 '<path d="M'+(x+6)+' '+(y+1)+'l-3 -6M'+(x+w*.5)+' '+(y+1)+'l2 -7M'+(x+w-8)+' '+(y+1)+'l4 -5" stroke="var(--hay-2)" stroke-width="2.4" stroke-linecap="round"/>'}
window.ILLU={
 /* tête de cheval alezan liste en tête, filet saphir : tourne la tête, bouge l'oreille, cligne */
 cheval:function(o){return wrap('cheval','60 30 200 232',
  '<circle cx="168" cy="146" r="92" fill="var(--acc)" opacity=".10"/>'+
  '<path d="M118 262C122 214 138 176 160 150L226 148C238 188 244 226 250 262Z" fill="var(--coat)"/>'+
  '<path d="M186 96C212 104 232 130 240 160C247 192 248 226 254 262H236C232 222 226 192 216 166C208 144 196 126 178 112Z" fill="var(--mane)"/>'+
  '<g class="il-sway">'+
   '<g class="il-ear"><path d="M166 84L160 36C176 46 186 62 188 80Z" fill="var(--coat)"/><path d="M168 76L165 48C173 56 178 66 179 76Z" fill="var(--coat-2)"/></g>'+
   '<path d="M188 80L198 38C210 54 212 72 206 90Z" fill="var(--coat-2)"/>'+
   '<path d="M174 72C200 70 224 92 224 120C224 141 213 154 200 162L138 208C122 220 94 218 84 199C76 183 84 167 98 159L158 98C162 84 166 74 174 72Z" fill="var(--coat)"/>'+
   '<path d="M84 199C76 183 84 167 98 159L114 150C121 170 122 192 113 210C102 216 90 211 84 199Z" fill="var(--coat-2)"/>'+
   '<path d="M172 104C163 125 147 146 125 168C119 174 115 182 117 190C126 178 141 162 157 146C169 132 177 118 179 104Z" fill="var(--blaze)"/>'+
   '<path d="M160 80C170 92 168 106 158 114C174 108 188 98 194 82C184 76 170 74 160 80Z" fill="var(--mane)"/>'+
   '<g class="il-blink"><ellipse cx="181" cy="113" rx="6.5" ry="7.5" fill="#1b1410"/><circle cx="183.5" cy="110" r="2.3" fill="#fff"/></g>'+
   '<path d="M171 104C176 99 186 99 191 104" stroke="#1b1410" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>'+
   '<path d="M97 183C99 176 106 174 111 179" stroke="#1b1410" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".7"/>'+
   '<path d="M90 205C97 209 105 209 112 205" stroke="#1b1410" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45"/>'+
   '<path d="M112 150C127 160 132 184 124 207" stroke="var(--acc)" stroke-width="8" fill="none" stroke-linecap="round"/>'+
   '<path d="M126 168L200 130L206 88" stroke="var(--acc)" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
   '<path d="M200 130L214 154" stroke="var(--acc)" stroke-width="8" fill="none" stroke-linecap="round"/>'+
   '<circle cx="126" cy="168" r="8" fill="none" stroke="#dfe5f7" stroke-width="4"/>'+
   '<path d="M126 156Q126 168 138 168Q126 168 126 180Q126 168 114 168Q126 168 126 156Z" fill="var(--strass)"/>'+
  '</g>',o)},
 /* fer à cheval suspendu qui se balance */
 fer:function(o){return wrap('fer','0 0 100 100','<g class="il-swing"><circle cx="50" cy="6" r="3" fill="var(--hz-ink)" opacity=".5"/><path d="M50 6L34 26M50 6L66 26" stroke="var(--hz-ink)" stroke-width="2" opacity=".35"/>'+
  '<path d="M30 26C16 40 14 64 26 78C35 89 65 89 74 78C86 64 84 40 70 26" fill="none" stroke="var(--hz)" stroke-width="15" stroke-linecap="round"/>'+
  '<path d="M30 26C16 40 14 64 26 78C35 89 65 89 74 78C86 64 84 40 70 26" fill="none" stroke="var(--hz-ink)" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round" opacity=".55"/>'+
  '<g fill="var(--hz-bg)"><circle cx="24" cy="44" r="2.6"/><circle cx="22" cy="60" r="2.6"/><circle cx="76" cy="44" r="2.6"/><circle cx="78" cy="60" r="2.6"/></g></g>'+SP(84,20,8),o)},
 /* selle qui se pose en se balançant */
 selle:function(o){return wrap('selle','0 0 120 110','<g class="il-rock">'+
  '<path d="M14 52C14 45 20 41 27 43L100 37C109 37 111 46 106 52L96 86C94 92 88 94 82 94H34C26 94 20 90 18 84Z" fill="var(--rd-bg)"/>'+
  '<path d="M42 58H80C82 72 80 84 74 94H48C44 84 42 70 42 58Z" fill="var(--rd-ink)" opacity=".85"/>'+
  '<path d="M18 46C30 40 44 52 60 52C76 52 88 33 104 29C109 29 111 34 107 38C97 48 92 62 80 70H36C26 66 18 58 18 46Z" fill="var(--rd)"/>'+
  '<path d="M24 46C34 44 46 54 60 54" stroke="var(--rd-bg)" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>'+
  '<path d="M61 62V96" stroke="var(--rd-ink)" stroke-width="3"/><path d="M52 96H70L67 104H55Z" fill="none" stroke="var(--rd-ink)" stroke-width="3.2" stroke-linejoin="round"/></g>',o)},
 /* pile de pièces : la dernière tombe en tournant */
 pieces:function(o){var cn='';for(var i=0;i<3;i++){var y=84-i*13;cn+='<path d="M22 '+y+'v-8c0 6 12 10 28 10s28-4 28-10v8c0 6-12 10-28 10s-28-4-28-10z" fill="var(--mo-ink)" opacity=".75"/><ellipse cx="50" cy="'+(y-8)+'" rx="28" ry="10" fill="var(--mo)"/>'}
  return wrap('pieces','0 0 100 100',cn+'<g class="il-flip"><path d="M22 37v-1c0 6 12 10 28 10s28-4 28-10v1c0 6-12 10-28 10s-28-4-28-10z" fill="var(--mo-ink)" opacity=".75"/><ellipse cx="50" cy="36" rx="28" ry="10" fill="var(--mo)" stroke="var(--mo-ink)" stroke-width="2.5"/><ellipse cx="50" cy="36" rx="18" ry="5.5" fill="none" stroke="var(--mo-ink)" stroke-width="2" opacity=".5"/></g>'+SP(86,18,7),o)},
 /* bottes de foin : celle du haut se pose, la pile s'écrase, des brins tombent */
 foin:function(o){return wrap('foin','0 0 140 112','<ellipse cx="70" cy="104" rx="64" ry="6" fill="var(--ink)" opacity=".08"/><g class="il-squash">'+BALE(8,58,60,42)+BALE(72,58,60,42)+'</g><g class="il-drop">'+BALE(40,14,60,42)+'</g>'+
  '<g stroke="var(--hay-2)" stroke-width="2.4" stroke-linecap="round"><path class="il-straw" style="--dx:-14px;--r:-80deg" d="M52 54l6-3"/><path class="il-straw" style="--dx:10px;--r:90deg" d="M86 52l5 3"/><path class="il-straw" style="--dx:-4px;--r:120deg" d="M70 50l1 6"/></g>',o)},
 /* seau d'eau dont la surface ondule */
 seau:function(o){return wrap('seau','0 0 100 100','<ellipse cx="50" cy="92" rx="34" ry="4" fill="var(--ink)" opacity=".08"/>'+
  '<path d="M24 26C24 6 76 6 76 26" fill="none" stroke="var(--steel-2)" stroke-width="3.5" stroke-linecap="round"/>'+
  '<path d="M18 30H82L74 84C73.4 88 70 90 66 90H34C30 90 26.6 88 26 84Z" fill="var(--tm)"/>'+
  '<path d="M20.6 44H79.4" stroke="var(--tm-ink)" stroke-width="3" opacity=".35"/><path d="M24 72H76" stroke="var(--tm-ink)" stroke-width="3" opacity=".35"/>'+
  '<ellipse cx="50" cy="30" rx="32" ry="7" fill="var(--tm-ink)"/>'+
  '<g class="il-wave"><ellipse cx="50" cy="31" rx="27" ry="4.6" fill="var(--tm-bg)"/><path d="M34 31c4-2 8 2 12 0s8 2 12 0" stroke="var(--tm)" stroke-width="2" fill="none" stroke-linecap="round"/></g>'+
  '<path class="il-shine" d="M30 40L33 76" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0"/>'+
  '<g class="il-drop"><path d="M74 6c3 4 5 7 5 9.5a5 5 0 0 1-10 0C69 13 71 10 74 6z" fill="var(--tm)"/></g>',o)},
 /* bombe d'équitation qui rebondit doucement, visière saphir */
 bombe:function(o){return wrap('bombe','0 0 100 100','<ellipse cx="50" cy="90" rx="34" ry="4" fill="var(--ink)" opacity=".08"/><g class="il-bob">'+
  '<path d="M16 66C16 40 31 22 52 22C73 22 86 40 86 62L86 66Z" fill="var(--navy)"/>'+
  '<path d="M52 22C46 34 44 50 45 66M52 22C62 34 66 50 66 66" stroke="var(--strass)" stroke-width="2.4" fill="none" opacity=".55"/>'+
  '<path d="M14 66H90C93 66 94 70 91 72L80 76H14C11 76 10 66 14 66Z" fill="var(--acc)"/>'+
  '<circle cx="52" cy="22" r="4.5" fill="var(--acc)"/>'+
  '<path d="M22 70C26 82 34 86 40 86" stroke="var(--leather)" stroke-width="3" fill="none" stroke-linecap="round"/>'+
  '<path class="il-shine" d="M28 50C30 40 36 33 44 29" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0"/></g>'+SP(84,24,7),o)},
 /* van à chevaux qui arrive en roulant */
 van:function(o){return wrap('van','0 0 140 100','<ellipse cx="70" cy="90" rx="62" ry="4" fill="var(--ink)" opacity=".08"/><g class="il-roll">'+
  '<path d="M14 30C14 22 20 16 28 16H96C116 16 128 34 128 54V74C128 77 126 79 123 79H19C16 79 14 77 14 74Z" fill="var(--surface)" stroke="var(--line-2)" stroke-width="3"/>'+
  '<path d="M14 58H128V74C128 77 126 79 123 79H19C16 79 14 77 14 74Z" fill="var(--hz)"/>'+
  '<rect x="26" y="28" width="30" height="18" rx="6" fill="var(--tm-bg)"/><rect x="64" y="28" width="30" height="18" rx="6" fill="var(--tm-bg)"/>'+
  '<path d="M70 44C72 36 78 31 85 31L84 27L89 31C93 33 95 37 95 42" fill="var(--coat)"/>'+
  '<path d="M104 30H112C118 34 121 40 122 48H104Z" fill="var(--tm-bg)"/>'+
  '<path d="M6 70H14" stroke="var(--steel-2)" stroke-width="4" stroke-linecap="round"/>'+
  '<g class="il-wheel"><circle cx="40" cy="80" r="11" fill="var(--ink)"/><circle cx="40" cy="80" r="4.5" fill="var(--steel)"/><path d="M40 70v4M40 86v4" stroke="var(--steel)" stroke-width="2.5"/></g>'+
  '<g class="il-wheel"><circle cx="102" cy="80" r="11" fill="var(--ink)"/><circle cx="102" cy="80" r="4.5" fill="var(--steel)"/><path d="M102 70v4M102 86v4" stroke="var(--steel)" stroke-width="2.5"/></g></g>',o)},
 /* coupe qui scintille */
 trophee:function(o){return wrap('trophee','0 0 100 100','<ellipse cx="50" cy="92" rx="26" ry="3.5" fill="var(--ink)" opacity=".08"/><g class="il-rock">'+
  '<path d="M30 20H70V40C70 52 61 60 50 60C39 60 30 52 30 40Z" fill="var(--mo)"/>'+
  '<path d="M30 26H22C20 26 18 28 18.5 30.5C20 39 25 44 31 45M70 26H78C80 26 82 28 81.5 30.5C80 39 75 44 69 45" fill="none" stroke="var(--mo)" stroke-width="5" stroke-linecap="round"/>'+
  '<path d="M44 60H56L58 74H42Z" fill="var(--mo-ink)" opacity=".85"/>'+
  '<rect x="32" y="74" width="36" height="12" rx="4" fill="var(--navy)"/>'+
  '<rect x="40" y="78" width="20" height="4" rx="2" fill="var(--mo)"/>'+
  '<path class="il-shine" d="M38 26C38 36 40 44 45 50" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0"/>'+
  '<path d="M50 30l3.2 6.4 7 1-5.1 5 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5.1-5 7-1z" fill="var(--mo-bg)" opacity=".9"/></g>'+SP(82,14,7)+SP(16,58,5),o)},
 /* contrat qui se signe tout seul, puis un éclat */
 contrat:function(o){return wrap('contrat','0 0 100 100','<ellipse cx="50" cy="92" rx="30" ry="3.5" fill="var(--ink)" opacity=".08"/>'+
  '<path d="M26 10H62L78 26V84C78 86 76 88 74 88H26C24 88 22 86 22 84V14C22 12 24 10 26 10Z" fill="var(--surface)" stroke="var(--line-2)" stroke-width="3"/>'+
  '<path d="M62 10V26H78" fill="var(--acc-bg)" stroke="var(--line-2)" stroke-width="3" stroke-linejoin="round"/>'+
  '<path d="M32 34H66M32 44H66M32 54H54" stroke="var(--line-2)" stroke-width="4" stroke-linecap="round"/>'+
  '<path class="il-sign" d="M32 74C36 64 40 64 42 72S48 80 52 70 58 66 62 72 66 74 70 70" stroke="var(--acc)" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+
  '<g class="il-pop"><circle cx="76" cy="74" r="12" fill="var(--hz)"/><path d="M70.5 74.5l4 4 7-8" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>'+SP(86,52,6),o)}
};
})();
