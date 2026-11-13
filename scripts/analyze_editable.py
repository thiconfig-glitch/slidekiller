import zipfile
import xml.etree.ElementTree as ET

pptx_path = r"C:\Projetos\slidekiller_private_backup\novosexemplos\EXEMPLO EDITÁVEL.pptx"

with zipfile.ZipFile(pptx_path, 'r') as z:
    namespaces = {
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }
    
    slide_files = [f for f in z.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
    def get_num(s):
        base = s.replace('ppt/slides/slide', '').replace('.xml', '')
        return int(base) if base.isdigit() else 999
    slide_files.sort(key=get_num)
    
    for idx, sfile in enumerate(slide_files):
        tree = ET.fromstring(z.read(sfile))
        print(f"\n--- SLIDE {idx+1} ---")
        sp_nodes = tree.findall('.//p:sp', namespaces)
        for sp in sp_nodes:
            txBody = sp.find('p:txBody', namespaces)
            if txBody is None:
                continue
            xfrm = sp.find('.//a:xfrm', namespaces)
            off_x, off_y, ext_cx, ext_cy = 0, 0, 0, 0
            if xfrm is not None:
                off = xfrm.find('a:off', namespaces)
                ext = xfrm.find('a:ext', namespaces)
                if off is not None:
                    off_x = int(off.attrib.get('x', 0))/914400
                    off_y = int(off.attrib.get('y', 0))/914400
                if ext is not None:
                    ext_cx = int(ext.attrib.get('cx', 0))/914400
                    ext_cy = int(ext.attrib.get('cy', 0))/914400
            
            bodyPr = txBody.find('a:bodyPr', namespaces)
            anchor = bodyPr.attrib.get('anchor', 'top') if bodyPr is not None else 'top'
            lIns = int(bodyPr.attrib.get('lIns', 91440))/914400 if bodyPr is not None and 'lIns' in bodyPr.attrib else 0.1
            tIns = int(bodyPr.attrib.get('tIns', 45720))/914400 if bodyPr is not None and 'tIns' in bodyPr.attrib else 0.05
            
            p_elems = txBody.findall('a:p', namespaces)
            for p in p_elems:
                pPr = p.find('a:pPr', namespaces)
                algn = pPr.attrib.get('algn', 'l') if pPr is not None else 'l'
                lineSpacing = 'default'
                if pPr is not None:
                    spcPct = pPr.find('.//a:spcPct', namespaces)
                    spcPts = pPr.find('.//a:spcPts', namespaces)
                    if spcPct is not None:
                        lineSpacing = f"{int(spcPct.attrib.get('val', 0))/1000}%"
                    elif spcPts is not None:
                        lineSpacing = f"{int(spcPts.attrib.get('val', 0))/100}pt"
                
                full_text = ""
                runs_info = []
                for r in p.findall('a:r', namespaces):
                    t = r.find('a:t', namespaces)
                    rPr = r.find('a:rPr', namespaces)
                    txt = t.text if t is not None and t.text else ""
                    full_text += txt
                    sz = int(rPr.attrib.get('sz', 0))/100 if rPr is not None and 'sz' in rPr.attrib else None
                    b = rPr.attrib.get('b', '0') if rPr is not None else '0'
                    latin = rPr.find('a:latin', namespaces) if rPr is not None else None
                    font = latin.attrib.get('typeface') if latin is not None else None
                    clr_node = rPr.find('.//a:srgbClr', namespaces) if rPr is not None else None
                    clr = ('#' + clr_node.attrib.get('val')) if clr_node is not None else None
                    runs_info.append({'txt': txt, 'sz': sz, 'b': b, 'font': font, 'clr': clr})
                
                if full_text.strip():
                    print(f"  [Pos: x={off_x:.2f}\", y={off_y:.2f}\", w={ext_cx:.2f}\", h={ext_cy:.2f}\" | anchor={anchor} | algn={algn} | spc={lineSpacing}]")
                    print(f"    Text: {full_text}")
                    for ri in runs_info:
                        if ri['txt'].strip():
                            print(f"      run: \"{ri['txt']}\" -> font={ri['font']} sz={ri['sz']} b={ri['b']} clr={ri['clr']}")
