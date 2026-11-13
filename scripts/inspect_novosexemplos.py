import zipfile
import xml.etree.ElementTree as ET
import os

pptx_path = r"C:\Projetos\slidekiller_private_backup\novosexemplos\EXEMPLO EDITÁVEL.pptx"

with zipfile.ZipFile(pptx_path, 'r') as z:
    slide_files = [f for f in z.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
    def get_num(s):
        base = s.replace('ppt/slides/slide', '').replace('.xml', '')
        return int(base) if base.isdigit() else 999
    slide_files.sort(key=get_num)
    
    namespaces = {
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }
    
    print(f"Total slides: {len(slide_files)}")
    for idx, sfile in enumerate(slide_files):
        print(f"\n==================== SLIDE {idx+1} ({sfile}) ====================")
        tree = ET.fromstring(z.read(sfile))
        
        # Check background / blip
        blips = tree.findall('.//a:blip', namespaces)
        if blips:
            print(f"  [Background / Images embedded in slide]: {len(blips)}")
            for b in blips:
                embed = b.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                print(f"    blip embed r:id: {embed}")
        
        sp_nodes = tree.findall('.//p:sp', namespaces)
        for sp_idx, sp in enumerate(sp_nodes):
            txBody = sp.find('p:txBody', namespaces)
            xfrm = sp.find('.//a:xfrm', namespaces)
            pos_info = ""
            if xfrm is not None:
                off = xfrm.find('a:off', namespaces)
                ext = xfrm.find('a:ext', namespaces)
                if off is not None and ext is not None:
                    x = int(off.attrib.get('x', 0)) / 914400
                    y = int(off.attrib.get('y', 0)) / 914400
                    cx = int(ext.attrib.get('cx', 0)) / 914400
                    cy = int(ext.attrib.get('cy', 0)) / 914400
                    pos_info = f"pos: x={x:.2f}in, y={y:.2f}in, w={cx:.2f}in, h={cy:.2f}in"
            
            if txBody is not None:
                bodyPr = txBody.find('a:bodyPr', namespaces)
                body_info = ""
                if bodyPr is not None:
                    anchor = bodyPr.attrib.get('anchor', 'top')
                    body_info = f"anchor={anchor}"
                
                print(f"  Shape #{sp_idx+1} [Text] ({pos_info}) ({body_info}):")
                for p in txBody.findall('a:p', namespaces):
                    pPr = p.find('a:pPr', namespaces)
                    align = pPr.attrib.get('algn', 'l') if pPr is not None else 'l'
                    runs = p.findall('a:r', namespaces)
                    p_text = ""
                    run_details = []
                    for r in runs:
                        t = r.find('a:t', namespaces)
                        rPr = r.find('a:rPr', namespaces)
                        txt = t.text if t is not None and t.text else ""
                        p_text += txt
                        font_info = {}
                        if rPr is not None:
                            if 'sz' in rPr.attrib:
                                font_info['sz'] = int(rPr.attrib['sz']) / 100
                            if 'b' in rPr.attrib:
                                font_info['b'] = rPr.attrib['b']
                            latin = rPr.find('a:latin', namespaces)
                            if latin is not None:
                                font_info['font'] = latin.attrib.get('typeface')
                            srgbClr = rPr.find('.//a:srgbClr', namespaces)
                            if srgbClr is not None:
                                font_info['color'] = '#' + srgbClr.attrib.get('val')
                            schemeClr = rPr.find('.//a:schemeClr', namespaces)
                            if schemeClr is not None:
                                font_info['schemeColor'] = schemeClr.attrib.get('val')
                        run_details.append((txt, font_info))
                    if p_text.strip():
                        print(f"    Para [algn={align}]: \"{p_text}\"")
                        for txt, fi in run_details:
                            if txt.strip():
                                print(f"       -> \"{txt}\" | {fi}")
