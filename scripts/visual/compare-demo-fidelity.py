"""Create visual evidence without treating pixel error as a fidelity percentage."""
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageDraw, ImageStat
import json
root=Path(__file__).resolve().parents[2]
refs=root/'docs/demo-v2/pixel-reference';shots=root/'docs/demo-v2/fidelity-shots';out=root/'docs/demo-v2/fidelity-comparisons';out.mkdir(parents=True,exist_ok=True)
public=root/'public/demo/review';public.mkdir(parents=True,exist_ok=True)
manifest=json.loads((refs/'manifest.json').read_text());metrics=[]
for item in manifest:
 n=f"{item['id']:02}";a=Image.open(refs/f'{n}.png').convert('RGB');b=Image.open(shots/f'{n}.png').convert('RGB').resize(a.size,Image.Resampling.LANCZOS)
 # Screens are compared at the reference image's own dimensions.
 diff=ImageChops.difference(a,b);overlay=Image.blend(a,b,.5)
 overlay.save(out/f'{n}-overlay.jpg',quality=93);ImageEnhance.Contrast(diff).enhance(3).save(out/f'{n}-difference.jpg',quality=93)
 pair=Image.new('RGB',(a.width*2,a.height+38),'white');pair.paste(a,(0,38));pair.paste(b,(a.width,38));draw=ImageDraw.Draw(pair);draw.text((15,10),'REFERENCE',fill='black');draw.text((a.width+15,10),'IMPLEMENTATION',fill='black');pair.save(out/f'{n}-side-by-side.jpg',quality=93)
 metrics.append({'id':item['id'],'mean_absolute_rgb_error_0_255':round(sum(ImageStat.Stat(diff).mean)/3,2),'note':'Diagnostic only; not a fidelity percentage or acceptance score.'})
 for label,im in [('reference',a),('current',b)]:
  im.thumbnail((426,950));im.save(public/f'{n}-{label}.webp',quality=92)
 overlay.thumbnail((426,950));overlay.save(public/f'{n}-overlay.jpg',quality=90)
(out/'pixel-diagnostics.json').write_text(json.dumps(metrics,indent=2)+'\n')
