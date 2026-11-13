import zipfile
import xml.etree.ElementTree as ET

def get_slide_texts(pptx_path):
    z = zipfile.ZipFile(pptx_path)
    ns = {'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
    slide_files = [f for f in z.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
    def get_num(s):
        base = s.replace('ppt/slides/slide', '').replace('.xml', '')
        return int(base) if base.isdigit() else 999
    slide_files.sort(key=get_num)
    
    slides = []
    for sf in slide_files:
        tree = ET.fromstring(z.read(sf))
        paras = []
        for p in tree.findall('.//a:p', ns):
            runs = []
            for r in p.findall('a:r', ns):
                t = r.find('a:t', ns)
                if t is not None and t.text:
                    rPr = r.find('a:rPr', ns)
                    latin = rPr.find('a:latin', ns) if rPr is not None else None
                    font = latin.attrib.get('typeface') if latin is not None else ''
                    sz = int(rPr.attrib.get('sz', 0))/100 if rPr is not None and 'sz' in rPr.attrib else 0
                    srgb = rPr.find('.//a:srgbClr', ns) if rPr is not None else None
                    clr = srgb.attrib.get('val') if srgb is not None else ''
                    b = rPr.attrib.get('b', '0') if rPr is not None else '0'
                    runs.append({'text': t.text, 'font': font, 'sz': sz, 'clr': clr, 'b': b})
            pPr = p.find('a:pPr', ns)
            algn = pPr.attrib.get('algn', 'l') if pPr is not None else 'l'
            if runs:
                paras.append({'algn': algn, 'runs': runs, 'full_text': ''.join(r['text'] for r in runs)})
        slides.append({'file': sf, 'paras': paras})
    return slides

editable = get_slide_texts(r'C:\Projetos\slidekiller_private_backup\novosexemplos\EXEMPLO EDITÁVEL.pptx')
generated = get_slide_texts(r'C:\Projetos\slidekiller\downloads\Sermon_Nobre_Cinzel_Oficial.pptx')

print(f"EXEMPLO EDITÁVEL has {len(editable)} slides.")
print(f"GENERATED has {len(generated)} slides.\n")

print("=== SLIDES DO EXEMPLO EDITÁVEL ===")
for idx, s in enumerate(editable):
    print(f"Slide {idx+1}:")
    for p in s['paras']:
        print(f"  [{p['algn']}] {p['full_text']}")
        for r in p['runs']:
            if r['clr'] == 'E6C486' or 'Black' in r['font']:
                print(f"      * HIGHLIGHT ({r['clr']}, {r['font']}, {r['sz']}pt): \"{r['text']}\"")

print("\n=== SLIDES DO GERADO ===")
for idx, s in enumerate(generated):
    print(f"Slide {idx+1}:")
    for p in s['paras']:
        print(f"  [{p['algn']}] {p['full_text']}")
        for r in p['runs']:
            if r['clr'] == 'E6C486' or 'Black' in r['font']:
                print(f"      * HIGHLIGHT ({r['clr']}, {r['font']}, {r['sz']}pt): \"{r['text']}\"")
