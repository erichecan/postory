"""Extract individual artwork/photography assets, never complete UI screens."""
from PIL import Image
from pathlib import Path
import json
root=Path(__file__).resolve().parents[2]
source=root/'docs/demo-v2/pixel-reference'; dest=root/'public/demo/fidelity';dest.mkdir(parents=True,exist_ok=True)
crops={
'platform-0':(9,(55,411,139,495)), 'platform-1':(9,(55,680,139,767)), 'platform-2':(9,(55,949,139,1034)), 'platform-3':(9,(55,1179,139,1265)),
'nails-doodle-heart':(4,(699,274,761,352)), 'nails-sparkles':(3,(654,291,712,349)),
'sushi-12-left':(12,(0,162,119,399)), 'sushi-12-right':(12,(770,136,853,279)), 'sushi-restaurant':(12,(745,281,853,447)),
'sushi-13-left':(13,(0,214,145,362)), 'sushi-13-right':(13,(725,360,853,469)),
'sushi-14-left':(14,(0,193,130,432)), 'sushi-14-right':(14,(741,180,853,431)),
'sushi-15-left':(15,(0,201,121,443)), 'sushi-15-right':(15,(796,165,853,440)),
'sushi-16-left':(16,(0,199,130,435)), 'sushi-16-right':(16,(735,212,853,440)),
'sushi-17-left':(17,(0,225,175,442)), 'sushi-17-right':(17,(721,221,853,445)),
'sushi-19-left':(19,(0,166,110,433)), 'sushi-19-right':(19,(761,251,853,444)),
'sushi-12-bottom':(12,(0,1757,853,1844)), 'sushi-13-bottom':(13,(0,1750,853,1844)),
'sushi-14-bottom':(14,(0,1775,853,1844)), 'sushi-15-bottom':(15,(0,1760,853,1844)),
'sushi-16-bottom':(16,(0,1757,853,1844)), 'sushi-17-bottom':(17,(0,1765,853,1844)),
'sushi-19-bottom':(19,(0,1803,853,1844)),
'nails-logo':(4,(275,88,566,140)), 'nails-logo-full':(1,(38,82,433,161)),
'sushi-logo':(14,(123,63,505,150)), 'sushi-logo-full':(12,(67,58,491,150)),
'nail-photo-1':(2,(43,800,416,1006)), 'nail-photo-2':(2,(435,800,810,1006)),
'nail-photo-3':(2,(43,1022,416,1228)), 'nail-photo-4':(2,(435,1022,810,1228)),
'nail-photo-5':(10,(56,1505,186,1623)), 'nail-photo-6':(8,(43,1440,414,1567)),
'nails-art-edit':(5,(44,286,814,954)), 'nails-art-export':(3,(81,477,772,1294)),
'nails-art-schedule':(11,(51,310,410,716)),
'nails-template-0':(4,(36,520,411,845)), 'nails-template-1':(4,(439,514,824,851)),
'nails-template-2':(4,(31,913,416,1208)), 'nails-template-3':(4,(446,918,825,1210)),
'nails-template-4':(4,(31,1275,416,1576)), 'nails-template-5':(4,(439,1275,825,1576)),
'nails-landing-0':(1,(34,566,264,884)), 'nails-landing-1':(1,(285,527,568,951)),
'nails-landing-2':(1,(600,572,818,940)), 'nails-promo':(1,(49,1675,257,1805)),
'nails-tip-collage':(2,(591,1454,797,1633)), 'nails-dashboard-hero':(7,(473,170,819,420)),
'sushi-photo':(13,(68,1128,784,1432)),
'sushi-art-edit':(15,(52,637,573,1196)), 'sushi-art-adjust':(16,(49,526,487,997)),
'sushi-art-export':(19,(119,448,735,1069)), 'sushi-art-success':(18,(192,429,642,1021)),
'sushi-template-0':(14,(49,518,411,851)), 'sushi-template-1':(14,(448,518,811,851)),
'sushi-template-2':(14,(49,973,411,1304)), 'sushi-template-3':(14,(448,973,811,1304)),
'sushi-template-4':(14,(49,1426,411,1655)), 'sushi-template-5':(14,(448,1426,811,1655)),
'sushi-landing-0':(12,(49,543,275,821)), 'sushi-landing-1':(12,(291,509,565,895)),
'sushi-landing-2':(12,(588,551,815,881)), 'sushi-promo':(12,(59,1606,211,1736)),
'sushi-phone':(18,(519,1408,770,1702)), 'sushi-texture':(13,(402,14,492,57)),
}
for name,(page,box) in crops.items():
 im=Image.open(source/f'{page:02}.png'); im.crop(box).save(dest/f'{name}.webp',quality=98)
(dest/'provenance.json').write_text(json.dumps({k:{'reference':f'{v[0]:02}.png','crop':v[1]} for k,v in crops.items()},indent=2)+'\n')
